using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KerkPlanner.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261013193000_AddGuestEnrollments")]
    public partial class AddGuestEnrollments : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // SQLite kan een bestaande NOT NULL foreign key niet rechtstreeks nullable maken,
            // daarom wordt de tabel opnieuw opgebouwd en worden bestaande account-inschrijvingen bewaard.
            migrationBuilder.Sql("""
                CREATE TABLE "Enrollments_New" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_Enrollments" PRIMARY KEY,
                    "UserId" TEXT NULL,
                    "FirstName" TEXT NOT NULL DEFAULT '',
                    "LastName" TEXT NOT NULL DEFAULT '',
                    "PhoneNumber" TEXT NULL,
                    "WorkDayId" TEXT NOT NULL,
                    "ActivityId" TEXT NULL,
                    "BringsVehicle" INTEGER NOT NULL,
                    "BringsTools" INTEGER NOT NULL,
                    "SpecificSkills" TEXT NOT NULL,
                    "Remarks" TEXT NOT NULL,
                    "SelectedTools" TEXT NOT NULL DEFAULT '',
                    CONSTRAINT "FK_Enrollments_Activities_ActivityId" FOREIGN KEY ("ActivityId") REFERENCES "Activities" ("Id") ON DELETE RESTRICT,
                    CONSTRAINT "FK_Enrollments_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE SET NULL,
                    CONSTRAINT "FK_Enrollments_WorkDays_WorkDayId" FOREIGN KEY ("WorkDayId") REFERENCES "WorkDays" ("Id") ON DELETE RESTRICT
                );
                INSERT INTO "Enrollments_New" ("Id", "UserId", "FirstName", "LastName", "PhoneNumber", "WorkDayId", "ActivityId", "BringsVehicle", "BringsTools", "SpecificSkills", "Remarks", "SelectedTools")
                SELECT "Id", "UserId", '', '', NULL, "WorkDayId", "ActivityId", "BringsVehicle", "BringsTools", "SpecificSkills", "Remarks", "SelectedTools"
                FROM "Enrollments";
                DROP TABLE "Enrollments";
                ALTER TABLE "Enrollments_New" RENAME TO "Enrollments";
                CREATE INDEX "IX_Enrollments_ActivityId" ON "Enrollments" ("ActivityId");
                CREATE INDEX "IX_Enrollments_UserId" ON "Enrollments" ("UserId");
                CREATE INDEX "IX_Enrollments_WorkDayId" ON "Enrollments" ("WorkDayId");
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Gastinschrijvingen hebben geen UserId en kunnen niet terug naar het oude schema.
            migrationBuilder.Sql("""
                CREATE TABLE "Enrollments_Old" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_Enrollments" PRIMARY KEY,
                    "UserId" TEXT NOT NULL,
                    "WorkDayId" TEXT NOT NULL,
                    "ActivityId" TEXT NULL,
                    "BringsVehicle" INTEGER NOT NULL,
                    "BringsTools" INTEGER NOT NULL,
                    "SpecificSkills" TEXT NOT NULL,
                    "Remarks" TEXT NOT NULL,
                    "SelectedTools" TEXT NOT NULL DEFAULT '',
                    CONSTRAINT "FK_Enrollments_Activities_ActivityId" FOREIGN KEY ("ActivityId") REFERENCES "Activities" ("Id") ON DELETE RESTRICT,
                    CONSTRAINT "FK_Enrollments_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
                    CONSTRAINT "FK_Enrollments_WorkDays_WorkDayId" FOREIGN KEY ("WorkDayId") REFERENCES "WorkDays" ("Id") ON DELETE RESTRICT
                );
                INSERT INTO "Enrollments_Old" ("Id", "UserId", "WorkDayId", "ActivityId", "BringsVehicle", "BringsTools", "SpecificSkills", "Remarks", "SelectedTools")
                SELECT "Id", "UserId", "WorkDayId", "ActivityId", "BringsVehicle", "BringsTools", "SpecificSkills", "Remarks", "SelectedTools"
                FROM "Enrollments" WHERE "UserId" IS NOT NULL;
                DROP TABLE "Enrollments";
                ALTER TABLE "Enrollments_Old" RENAME TO "Enrollments";
                CREATE INDEX "IX_Enrollments_ActivityId" ON "Enrollments" ("ActivityId");
                CREATE INDEX "IX_Enrollments_UserId" ON "Enrollments" ("UserId");
                CREATE INDEX "IX_Enrollments_WorkDayId" ON "Enrollments" ("WorkDayId");
                """);
        }
    }
}
