using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KerkPlanner.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WorkDays",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    CoordinatorId = table.Column<int>(type: "int", nullable: true),
                    OpenerId = table.Column<int>(type: "int", nullable: true),
                    CloserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkDays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkDays_Users_CloserId",
                        column: x => x.CloserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkDays_Users_CoordinatorId",
                        column: x => x.CoordinatorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkDays_Users_OpenerId",
                        column: x => x.OpenerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Activities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkDayId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RequiredVolunteers = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    MaterialsNeeded = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SafetyInstructions = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Activities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Activities_WorkDays_WorkDayId",
                        column: x => x.WorkDayId,
                        principalTable: "WorkDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Enrollments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ActivityId = table.Column<int>(type: "int", nullable: true),
                    WorkDayId = table.Column<int>(type: "int", nullable: false),
                    BringsVehicle = table.Column<bool>(type: "bit", nullable: false),
                    BringsTools = table.Column<bool>(type: "bit", nullable: false),
                    SpecificSkills = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Enrollments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Enrollments_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Enrollments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Enrollments_WorkDays_WorkDayId",
                        column: x => x.WorkDayId,
                        principalTable: "WorkDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Activities_WorkDayId",
                table: "Activities",
                column: "WorkDayId");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_ActivityId",
                table: "Enrollments",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_User_Activity",
                table: "Enrollments",
                columns: new[] { "UserId", "ActivityId" },
                unique: true,
                filter: "[ActivityId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_User_WorkDay_General",
                table: "Enrollments",
                columns: new[] { "UserId", "WorkDayId" },
                unique: true,
                filter: "[ActivityId] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_WorkDayId",
                table: "Enrollments",
                column: "WorkDayId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_FirstName_LastName",
                table: "Users",
                columns: new[] { "FirstName", "LastName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkDays_CloserId",
                table: "WorkDays",
                column: "CloserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkDays_CoordinatorId",
                table: "WorkDays",
                column: "CoordinatorId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkDays_Date",
                table: "WorkDays",
                column: "Date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkDays_OpenerId",
                table: "WorkDays",
                column: "OpenerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Enrollments");

            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "WorkDays");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
