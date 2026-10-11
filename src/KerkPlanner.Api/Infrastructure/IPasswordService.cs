using KerkPlanner.Api.Domain;

namespace KerkPlanner.Api.Infrastructure;

public interface IPasswordService
{
    string Hash(string password);
    bool Verify(User user, string password);
}
