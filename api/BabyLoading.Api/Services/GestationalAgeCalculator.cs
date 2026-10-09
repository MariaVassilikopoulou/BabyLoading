namespace BabyLoading.Api.Services;

public record GestationalAge(int Weeks, int Days);

// Natural conception and IUI are dated from LMP, even though ovulation/fertilization happens
// ~2 weeks later — that's the clinical convention. IUI approximates natural ovulation timing,
// so it doesn't get a different reference point. IVF is dated from the known transfer day instead,
// which is more precise since the embryo's age at transfer (day 3 or day 5) is already known.
public static class GestationalAgeCalculator
{
    public static GestationalAge FromLastMenstrualPeriod(DateOnly lmpDate, DateOnly onDate)
    {
        var totalDays = onDate.DayNumber - lmpDate.DayNumber;
        return new GestationalAge(totalDays / 7, totalDays % 7);
    }

    public static GestationalAge FromIvfTransfer(DateOnly transferDate, int transferDayNumber, DateOnly onDate)
    {
        // Gestational age at transfer = embryo age + the ~2 weeks a natural cycle takes to reach
        // ovulation/fertilization from LMP.
        var gestationalAgeAtTransferDays = transferDayNumber + 14;
        var totalDays = (onDate.DayNumber - transferDate.DayNumber) + gestationalAgeAtTransferDays;
        return new GestationalAge(totalDays / 7, totalDays % 7);
    }

    public static DateOnly EstimatedDueDateFromLmp(DateOnly lmpDate) => lmpDate.AddDays(280);

    public static DateOnly EstimatedDueDateFromIvfTransfer(DateOnly transferDate, int transferDayNumber)
    {
        // Day-5 transfer: due date = transfer date + 261 days. Day-3: +263 days.
        var offsetDays = 266 - transferDayNumber;
        return transferDate.AddDays(offsetDays);
    }
}
