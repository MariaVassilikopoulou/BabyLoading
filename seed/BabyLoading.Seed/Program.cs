using BabyLoading.Api.Configuration;
using BabyLoading.Api.Models;
using BabyLoading.Api.Services;
using Microsoft.Azure.Cosmos;

const string userId = "demo-user"; // matches FakeCurrentUserService

var connectionString = Environment.GetEnvironmentVariable("COSMOS_CONNECTION_STRING")
    ?? "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

var options = new CosmosOptions { ConnectionString = connectionString };
// This script only ever targets the local Cosmos DB Emulator, so always accept its self-signed cert.
using var client = CosmosBootstrapper.CreateClient(options, acceptEmulatorCertificate: true);
var container = CosmosBootstrapper.CreateContainer(client, options);

Console.WriteLine("Clearing any existing demo data for 'demo-user'...");
await ClearExistingDemoDataAsync(container, userId);

Console.WriteLine("Seeding a fake journey: trying -> IVF -> pregnancy up to today...");

var journeyRepo = new CosmosRepository<Journey>(container, EntryTypes.Journey);
var cycleRepo = new CosmosRepository<CycleEntry>(container, EntryTypes.Cycle);
var treatmentRepo = new CosmosRepository<TreatmentEntry>(container, EntryTypes.Treatment);
var journalRepo = new CosmosRepository<JournalEntry>(container, EntryTypes.Journal);

var rng = new Random(42); // fixed seed so reseeding gives the same demo data every time.
var journeyStart = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-300);

// --- Trying phase: a couple of cycles of period + LH tracking ---
var cycleDate = journeyStart;
for (var cycle = 0; cycle < 2; cycle++)
{
    await cycleRepo.CreateAsync(new CycleEntry { UserId = userId, Date = cycleDate, EntryType = CycleEntryType.Period, Value = 1 });
    await cycleRepo.CreateAsync(new CycleEntry { UserId = userId, Date = cycleDate.AddDays(13), EntryType = CycleEntryType.LhTest, Value = 1 });
    cycleDate = cycleDate.AddDays(28);
}

// --- Treatment phase: IVF stimulation -> trigger -> retrieval -> day-5 transfer -> beta hCG ---
var stimStart = cycleDate;
string[] doses = ["150 IU", "150 IU", "225 IU", "225 IU", "225 IU", "300 IU", "300 IU", "300 IU", "300 IU"];
for (var day = 0; day < doses.Length; day++)
{
    var isScanDay = day is 4 or 6 or 8;
    await treatmentRepo.CreateAsync(new TreatmentEntry
    {
        UserId = userId,
        Date = stimStart.AddDays(day),
        Step = TreatmentStep.Stimulation,
        CycleDay = day + 1,
        Medication = "Gonal-F",
        Dose = doses[day],
        Time = new TimeOnly(20, 0),
        ClinicVisit = isScanDay,
        ScanResults = isScanDay ? new ScanResult { FollicleCount = 4 + day, LiningMm = 7 + day * 0.4 } : null
    });
}

var triggerDate = stimStart.AddDays(doses.Length);
await treatmentRepo.CreateAsync(new TreatmentEntry
{
    UserId = userId,
    Date = triggerDate,
    Step = TreatmentStep.Trigger,
    CycleDay = doses.Length + 1,
    Medication = "Ovitrelle (trigger shot)",
    Dose = "250 mcg",
    Time = new TimeOnly(21, 0),
});

var retrievalDate = triggerDate.AddDays(2);
await treatmentRepo.CreateAsync(new TreatmentEntry
{
    UserId = userId,
    Date = retrievalDate,
    Step = TreatmentStep.Retrieval,
    CycleDay = doses.Length + 3,
    ClinicVisit = true,
    ScanResults = new ScanResult { FollicleCount = 12 }
});

var transferDate = retrievalDate.AddDays(5); // day-5 blastocyst transfer
const int transferDayNumber = 5;
await treatmentRepo.CreateAsync(new TreatmentEntry
{
    UserId = userId,
    Date = transferDate,
    Step = TreatmentStep.Transfer,
    ClinicVisit = true,
    Medication = "Progesterone support",
    Dose = "200 mg"
});

var betaHcgDate = transferDate.AddDays(10);
await treatmentRepo.CreateAsync(new TreatmentEntry
{
    UserId = userId,
    Date = betaHcgDate,
    Step = TreatmentStep.PregnancyTest,
    ClinicVisit = true,
    BetaHcgResult = 215.0
});

// --- Pregnant phase: weekly journal entries up to today (never future-dated) ---
await journeyRepo.CreateAsync(new Journey
{
    UserId = userId,
    Phase = JourneyPhase.Pregnant,
    StartDate = journeyStart,
    ConceptionPath = ConceptionPath.Ivf,
    IvfTransferDate = transferDate,
    IvfTransferDayNumber = transferDayNumber
});

// Gestational age at a day-5 transfer is already 2 weeks + 5 days (see GestationalAgeCalculator),
// so "week N" below is dated N*7 days after that implied reference point, not after the transfer itself.
var pregnancyWeekStart = transferDate.AddDays(-(transferDayNumber + 14));

string[] earlySymptoms = ["nausea", "fatigue", "tender breasts"];
string[] laterSymptoms = ["back pain", "heartburn", "swollen feet", "fatigue"];

// A couple of moments she "pinned", so the milestone log has something from her own words.
var milestoneTexts = new Dictionary<int, string>
{
    [8] = "Heard the heartbeat for the first time. I cried in the car afterwards.",
    [19] = "First real kicks tonight! I couldn't stop smiling.",
};

var today = DateOnly.FromDateTime(DateTime.UtcNow);
for (var week = 1; week <= 40; week++)
{
    var entryDate = pregnancyWeekStart.AddDays(week * 7);
    if (entryDate > today)
    {
        break;
    }

    var mood = 3 + rng.Next(0, 3); // 3-5: generally positive with natural variation
    var symptomPool = week <= 13 ? earlySymptoms : laterSymptoms;
    var symptoms = symptomPool
        .OrderBy(_ => rng.Next())
        .Take(rng.Next(1, 3))
        .Select(name => new Symptom { Name = name, Severity = rng.Next(1, 5) })
        .ToList();

    await journalRepo.CreateAsync(new JournalEntry
    {
        UserId = userId,
        Date = entryDate,
        Text = milestoneTexts.GetValueOrDefault(week, $"Week {week}: feeling {(mood >= 4 ? "pretty good" : "a bit rough")} today."),
        Mood = milestoneTexts.ContainsKey(week) ? 5 : mood,
        Symptoms = symptoms,
        Phase = JourneyPhase.Pregnant,
        IsMilestone = milestoneTexts.ContainsKey(week),
        PregnancyWeek = week
    });
}

Console.WriteLine("Done. Seeded 2 cycles, an IVF treatment course, and weekly pregnancy journal entries up to today for 'demo-user'.");

static async Task ClearExistingDemoDataAsync(Container container, string userId)
{
    var query = new QueryDefinition("SELECT c.id FROM c WHERE c.userId = @userId")
        .WithParameter("@userId", userId);

    using var iterator = container.GetItemQueryIterator<IdOnly>(
        query,
        requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(userId) });

    while (iterator.HasMoreResults)
    {
        foreach (var item in await iterator.ReadNextAsync())
        {
            await container.DeleteItemAsync<IdOnly>(item.Id, new PartitionKey(userId));
        }
    }
}

file sealed class IdOnly
{
    public string Id { get; set; } = string.Empty;
}
