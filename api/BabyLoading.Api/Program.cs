using System.Text.Json.Serialization;
using BabyLoading.Api.Configuration;
using BabyLoading.Api.Models;
using BabyLoading.Api.Services;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<CosmosOptions>(builder.Configuration.GetSection("Cosmos"));

builder.Services
    .AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Web", policy => policy
        .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddSingleton(sp => CosmosBootstrapper.CreateClient(
    sp.GetRequiredService<IOptions<CosmosOptions>>().Value,
    acceptEmulatorCertificate: builder.Environment.IsDevelopment()));

builder.Services.AddSingleton(sp => CosmosBootstrapper.CreateContainer(
    sp.GetRequiredService<CosmosClient>(),
    sp.GetRequiredService<IOptions<CosmosOptions>>().Value));

builder.Services.AddSingleton(sp => new CosmosRepository<JournalEntry>(sp.GetRequiredService<Container>(), EntryTypes.Journal));
builder.Services.AddSingleton(sp => new CosmosRepository<CycleEntry>(sp.GetRequiredService<Container>(), EntryTypes.Cycle));
builder.Services.AddSingleton(sp => new CosmosRepository<TreatmentEntry>(sp.GetRequiredService<Container>(), EntryTypes.Treatment));
builder.Services.AddSingleton(sp => new CosmosRepository<Journey>(sp.GetRequiredService<Container>(), EntryTypes.Journey));

builder.Services.AddSingleton<JourneyService>();
builder.Services.AddSingleton<ICurrentUserService, FakeCurrentUserService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("Web");
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }
