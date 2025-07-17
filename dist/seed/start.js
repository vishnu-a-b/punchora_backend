"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const configs_1 = __importDefault(require("../src/configs/configs"));
const User_1 = require("../src/modules/user/models/User");
const Role_1 = require("../src/modules/role/models/Role");
const District_1 = require("../src/modules/lists/district/models/District");
const Taluk_1 = require("../src/modules/lists/taluk/models/Taluk");
const bcrypt = require("bcryptjs");
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(`mongodb+srv://${configs_1.default.mongoUser}:${configs_1.default.mongoPassword}@${configs_1.default.mongoHost}/${configs_1.default.mongoDatabase}`);
    yield seedAdminUser();
    yield seedRoles();
    yield seedDistricts();
    console.log("seed completed");
});
run();
const seedAdminUser = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("seed users");
    const password = yield bcrypt.hash("admin@123", 10);
    const admin = {
        name: "admin",
        mobileNo: "1111122222",
        password,
        gender: "Male",
        maritalStatus: "Unknown",
        isActive: true,
        isSuperAdmin: true,
        photos: [],
    };
    yield User_1.User.create(admin);
});
const seedRoles = () => __awaiter(void 0, void 0, void 0, function* () {
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
    yield Role_1.Role.insertMany(rolesData);
});
const seedDistricts = () => __awaiter(void 0, void 0, void 0, function* () {
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
        const district = yield District_1.District.create({ name: item.district });
        for (const taluk of item.taluks) {
            const value = yield Taluk_1.Taluk.create({ name: taluk, district: district._id });
        }
    }
});
