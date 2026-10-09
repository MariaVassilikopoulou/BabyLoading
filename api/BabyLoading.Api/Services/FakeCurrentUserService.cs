namespace BabyLoading.Api.Services;

// Stands in for real auth until Entra External ID replaces it in Phase 5 (see PROJECT.md).
// A single fixed user is enough for local dev/demo since there are no real users.
public class FakeCurrentUserService : ICurrentUserService
{
    public string UserId => "demo-user";
}
