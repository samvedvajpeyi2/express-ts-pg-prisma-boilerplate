import { prisma } from "../src/config/prisma.ts";
import bcrypt from "bcryptjs";

// Roles
const roles = [
    { id: 1, name: "ADMIN" },
    { id: 2, name: "USER" },
];

// Users
const users = [
    {
        id: 1,
        email: "admin@example.com",
        password: bcrypt.hashSync("password", 10),
        firstname: "Admin",
        lastname: "User",
        roleId: 1,
    },
    {
        id: 2,
        email: "user@example.com",
        password: bcrypt.hashSync("password", 10),
        firstname: "Regular",
        lastname: "User",
        roleId: 2,
    },
];

const main = async () => {
    // Clear existing data
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    for (const roleData of roles) {
        await prisma.role.create({
            data: roleData,
        });
        console.log(`Created role: ${roleData.name}`);
    }

    for (const userData of users) {
        await prisma.user.create({
            data: userData,
        });
        console.log(`Created user: ${userData.email}`);
    }
    console.log("✅ Database seeded successfully!");
};

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
