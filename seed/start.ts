import mongoose from "mongoose";
import Configs from "../src/configs/configs";
import { User } from "../src/modules/user/models/User";
import { Role } from "../src/modules/role/models/Role";
import { District } from "../src/modules/lists/district/models/District";
import { Taluk } from "../src/modules/lists/taluk/models/Taluk";

const bcrypt = require("bcryptjs");
const run = async () => {
  await mongoose.connect(
   `mongodb://${Configs.mongoUser}:${Configs.mongoPassword}@${Configs.mongoHost}:27017/${Configs.mongoDatabase}`
  );
  await seedAdminUser();
  // await seedRoles();
  // await seedDistricts();
  console.log("seed completed");
};

run();

const seedAdminUser = async () => {
  console.log("seed users");
  const password = await bcrypt.hash("admin@123", 10);
  const admin = {
    name: "admin",
    mobileNo: "1111122222",
    password,
    gender: "Male",
    maritalStatus: "Unknown",
    isActive: true,
    isSuperAdmin: true,
    photos:
      ["https://wallpapers.com/images/high/the-batman-2022-digital-art-1of7ifxxcxh364oz.webp"],
  };
  await User.create(admin);
};

const seedRoles = async () => {
  console.log("seed roles");

  const rolesData = [
    {
      title: "Help Desk Admin",
      slug: "help-desk-admin",
    },
    {
      title: "Hospital Admin",
      slug: "hospital-admin",
    },
    {
      title: "Doctor",
      slug: "doctor",
    },
    {
      title: "Nurse",
      slug: "nurse",
    },
    {
      title: "Supporting Staff",
      slug: "supporting-staff",
    },
    {
      title: "Patient",
      slug: "patient",
    },
    {
      title: "Homecare Bystander",
      slug: "homecare-bystander",
    },
  ];
  await Role.insertMany(rolesData);
};

const seedDistricts = async () => {
  console.log("seed districts");

  const data = [
    {
      district: "Thiruvananthapuram",
      taluks: [
        "Neyyanttinkara",
        "Kattakada",
        "Nedumangadu",
        "Thiruvananthapuram",
        "Chirayyinkeezu",
        "Varkala",
      ],
    },

    {
      district: "Kollam",
      taluks: [
        "Kollam",
        "Kunnathoor",
        "Karunagappally",
        "Kottarakkara",
        "Punalur",
        "Pathanapuram",
      ],
    },

    {
      district: "Pathanamthitta",
      taluks: [
        "Adoor",
        "Konni",
        "Kozhencherry",
        "Ranni",
        "Mallappally",
        "Thiruvalla",
      ],
    },

    {
      district: "Kottayam",
      taluks: [
        "Changanassery",
        "Kottayam",
        "Vaikom",
        "Meenachil",
        "Kanjirappally",
      ],
    },

    {
      district: "Alappuzha",
      taluks: [
        "Chenganoor",
        "Mavelikkara",
        "Karthikappally",
        "Kuttanad",
        "Ambalappuzha",
        "Cherthala",
      ],
    },

    {
      district: "Ernakulam",
      taluks: [
        "Kothamangalam",
        "Muvattupuzha",
        "Kunnathunad",
        "Kanayannur",
        "Kochi",
        "North Paravur",
        "Aluva",
      ],
    },
    {
      district: "Thrissur",
      taluks: [
        "Chalakudy",
        "Mukundapuram",
        "Kodungallur",
        "Chavakkad",
        "Kunnamkulam",
        "Thalapilly",
      ],
    },

    {
      district: "Idukki",
      taluks: ["Peermade", "Udumbanchola", "Idukki", "Thodupuzha", "Devikulam"],
    },

    {
      district: "Palakkad",
      taluks: [
        "Alathoor",
        "Chittur",
        "Palakkad",
        "Pattambi",
        "Ottappalam",
        "Mannarkkad",
        "Attappady",
      ],
    },

    {
      district: "Wayanand",
      taluks: [
        "Vythiri",
        "Sulthan Bathery",
        "Mananthavady",
        "Perinthalmanna",
        "Nilambur",
      ],
    },
    {
      district: "Malappuram",
      taluks: ["Eranad", "Kondotty", "Ponnani", "Tirur", "Tirurangadi"],
    },

    {
      district: "Kozhikode",
      taluks: ["Kozhikode", "Thamarassery", "Koyilandy", "vatakara"],
    },

    {
      district: "Kannur",
      taluks: ["Thalassery", "Iritty", "Kannur", "Taliparamba", "Payyanur"],
    },
    {
      district: "Kasaragod",
      taluks: ["Hosdurg", "Vellarikundu", "Kasaragod", "Manjeshwaram"],
    },
  ];
  for (const item of data) {
    const district = await District.create({ name: item.district });
    for (const taluk of item.taluks) {
      const value = await Taluk.create({ name: taluk, district: district._id });
    }
  }
};
