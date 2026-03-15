import { prisma } from "../src/config/prisma.ts";
import bcrypt from "bcryptjs";
import { ROLE_NAMES } from "../src/constants/roles.ts";

// Roles
const roles = [{ name: ROLE_NAMES.ADMIN }, { name: ROLE_NAMES.USER }];

// Users
const users = [
    {
        email: "admin@example.com",
        password: bcrypt.hashSync("password", 10),
        firstname: "Admin",
        lastname: "User",
        roleName: ROLE_NAMES.ADMIN,
    },
    {
        email: "user@example.com",
        password: bcrypt.hashSync("password", 10),
        firstname: "Regular",
        lastname: "User",
        roleName: ROLE_NAMES.USER,
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
            data: {
                email: userData.email,
                password: userData.password,
                firstname: userData.firstname,
                lastname: userData.lastname,
                role: {
                    connect: {
                        name: userData.roleName,
                    },
                },
            },
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
