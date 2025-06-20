import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: "dvxoesaof",
    api_key: "237657869211133",
    api_secret: "ZKCYrFJYOItk7MY3tavm24YtHEM"
});

// Function to upload file in Cloudinary
export const uploadOnCloudinary = async (localFilePath: string): Promise<UploadApiResponse | null> => {
    try {
        if (!localFilePath) return null;
        const response: UploadApiResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "raw",
            secure: true,
        });

        // Remove the locally saved temporary file
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error: any) {
        console.log({ error: error.message });
        //  Safely attempt to delete the file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

// Function to delete a file from Cloudinary
export const deleteFromCloudinary = async (publicUrl: string, resourceType: "image" | "video" = "image"): Promise<void> => {
    const publicId = publicUrl.split('/').slice(-1)[0].split('.')[0];
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    } catch (error) {
        console.error(`Failed to delete ${resourceType} with public_id: ${publicId} from Cloudinary`, error);
        throw new Error(`Failed to delete ${resourceType} from Cloudinary`);
    }
};

