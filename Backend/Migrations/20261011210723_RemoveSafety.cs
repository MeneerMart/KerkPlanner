using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KerkPlanner.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSafety : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SafetyInstructions",
                table: "Activities");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SafetyInstructions",
                table: "Activities",
                type: "TEXT",
                maxLength: 250,
                nullable: false,
                defaultValue: "");
        }
    }
}
