import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { supabase } from "./supabase";

const MEDIA_BUCKET = "media";
const JPEG_EXTENSION = "jpg";
const JPEG_CONTENT_TYPE = "image/jpeg";
const JPEG_QUALITY = 0.86;

type PickAndUploadImageOptions = {
  pathPrefix: string;
  fileNamePrefix: string;
  aspect?: [number, number];
};

const ensureJpegBytes = async (
  asset: ImagePicker.ImagePickerAsset
): Promise<ArrayBuffer> => {
  const jpeg = await ImageManipulator.manipulateAsync(
    asset.uri,
    [],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  const response = await fetch(jpeg.uri);
  const bytes = await response.arrayBuffer();

  if (bytes.byteLength === 0) {
    throw new Error("empty-image-file");
  }

  return bytes;
};

export const pickAndUploadImage = async ({
  pathPrefix,
  fileNamePrefix,
  aspect = [1, 1],
}: PickAndUploadImageOptions): Promise<string | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("permission-denied");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect,
    quality: JPEG_QUALITY,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const bytes = await ensureJpegBytes(result.assets[0]);
  const safePrefix = pathPrefix.replace(/^\/+|\/+$/g, "");
  const path = `${safePrefix}/${fileNamePrefix}-${Date.now()}.${JPEG_EXTENSION}`;

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, bytes, {
      contentType: JPEG_CONTENT_TYPE,
      upsert: true,
    });

  if (error) {
    if (error.message.toLowerCase().includes("bucket not found")) {
      throw new Error("media-bucket-not-found");
    }
    throw error;
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
