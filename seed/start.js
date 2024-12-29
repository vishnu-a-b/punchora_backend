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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var configs_1 = require("../src/configs/configs");
var User_1 = require("../src/modules/user/models/User");
var Role_1 = require("../src/modules/role/models/Role");
var District_1 = require("../src/modules/lists/district/models/District");
var Taluk_1 = require("../src/modules/lists/taluk/models/Taluk");
var Speciality_1 = require("../src/modules/lists/speciality/models/Speciality");
var bcrypt = require("bcryptjs");
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, mongoose_1.default.connect("mongodb://".concat(configs_1.default.mongoUser, ":").concat(configs_1.default.mongoPassword, "@").concat(configs_1.default.mongoHost, ":27017/?authSource=").concat(configs_1.default.mongoDatabase))];
            case 1:
                _a.sent();
                return [4 /*yield*/, seedAdminUser()];
            case 2:
                _a.sent();
                return [4 /*yield*/, seedSpecialities()];
            case 3:
                _a.sent();
                return [4 /*yield*/, seedRoles()];
            case 4:
                _a.sent();
                return [4 /*yield*/, seedDistricts()];
            case 5:
                _a.sent();
                console.log("seed completed");
                return [2 /*return*/];
        }
    });
}); };
run();
var seedAdminUser = function () { return __awaiter(void 0, void 0, void 0, function () {
    var password, admin;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("seed users");
                return [4 /*yield*/, bcrypt.hash("admin@123", 10)];
            case 1:
                password = _a.sent();
                admin = {
                    name: "admin",
                    mobileNo: "1111122222",
                    password: password,
                    gender: "Male",
                    maritalStatus: "Unknown",
                    isActive: true,
                    isSuperAdmin: true,
                    photo: "https://wallpapers.com/images/high/the-batman-2022-digital-art-1of7ifxxcxh364oz.webp",
                };
                return [4 /*yield*/, User_1.User.create(admin)];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var seedRoles = function () { return __awaiter(void 0, void 0, void 0, function () {
    var rolesData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("seed roles");
                rolesData = [
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
                ];
                return [4 /*yield*/, Role_1.Role.insertMany(rolesData)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var seedSpecialities = function () { return __awaiter(void 0, void 0, void 0, function () {
    var specialityData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("seed specialities");
                specialityData = [
                    {
                        title: "Ortho",
                        slug: "ortho",
                    },
                    {
                        title: "Cardio",
                        slug: "Cardio",
                    },
                    {
                        title: "Pulmonary",
                        slug: "pulmonary",
                    },
                ];
                return [4 /*yield*/, Speciality_1.Speciality.insertMany(specialityData)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var seedDistricts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data, _i, data_1, item, district, _a, _b, taluk, value;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console.log("seed districts");
                data = [
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
                _i = 0, data_1 = data;
                _c.label = 1;
            case 1:
                if (!(_i < data_1.length)) return [3 /*break*/, 7];
                item = data_1[_i];
                return [4 /*yield*/, District_1.District.create({ name: item.district })];
            case 2:
                district = _c.sent();
                _a = 0, _b = item.taluks;
                _c.label = 3;
            case 3:
                if (!(_a < _b.length)) return [3 /*break*/, 6];
                taluk = _b[_a];
                return [4 /*yield*/, Taluk_1.Taluk.create({ name: taluk, district: district._id })];
            case 4:
                value = _c.sent();
                _c.label = 5;
            case 5:
                _a++;
                return [3 /*break*/, 3];
            case 6:
                _i++;
                return [3 /*break*/, 1];
            case 7: return [2 /*return*/];
        }
    });
}); };
