"use strict";
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
const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log({ localFilePath });
        if (!localFilePath)
            return null;
        const response = await cloudinary_1.v2.uploader.upload(localFilePath, {
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
};
exports.uploadOnCloudinary = uploadOnCloudinary;
// Function to delete a file from Cloudinary
const deleteFromCloudinary = async (publicUrl, resourceType = "image") => {
    const publicId = publicUrl.split('/').slice(-1)[0].split('.')[0];
    try {
        await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
    }
    catch (error) {
        console.error(`Failed to delete ${resourceType} with public_id: ${publicId} from Cloudinary`, error);
        throw new Error(`Failed to delete ${resourceType} from Cloudinary`);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
