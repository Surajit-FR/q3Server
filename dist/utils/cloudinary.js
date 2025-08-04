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
exports.deleteFromCloudinary = exports.uploadOnCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
// Configuration
cloudinary_1.v2.config({
    cloud_name: "dvxoesaof",
    api_key: "237657869211133",
    api_secret: "ZKCYrFJYOItk7MY3tavm24YtHEM"
});
// Function to upload file in Cloudinary
const uploadOnCloudinary = (localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!localFilePath)
            return null;
        const response = yield cloudinary_1.v2.uploader.upload(localFilePath, {
            resource_type: "raw",
            secure: true,
        });
        // Remove the locally saved temporary file
        fs_1.default.unlinkSync(localFilePath);
        return response;
    }
    catch (error) {
        console.log({ error: error.message });
        //  Safely attempt to delete the file
        if (fs_1.default.existsSync(localFilePath)) {
            fs_1.default.unlinkSync(localFilePath);
        }
        return null;
    }
});
exports.uploadOnCloudinary = uploadOnCloudinary;
// Function to delete a file from Cloudinary
const deleteFromCloudinary = (publicUrl_1, ...args_1) => __awaiter(void 0, [publicUrl_1, ...args_1], void 0, function* (publicUrl, resourceType = "image") {
    const publicId = publicUrl.split('/').slice(-1)[0].split('.')[0];
    try {
        yield cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
    }
    catch (error) {
        console.error(`Failed to delete ${resourceType} with public_id: ${publicId} from Cloudinary`, error);
        throw new Error(`Failed to delete ${resourceType} from Cloudinary`);
    }
});
exports.deleteFromCloudinary = deleteFromCloudinary;
