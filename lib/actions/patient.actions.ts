"use server";

import { ID, Query } from "node-appwrite";
import { BUCKET_ID, DATABASAE_ID, databases, ENDPOINT, PATIENT_COLLECTION_ID, PROJECT_ID, storage, users } from "../appwrite.config"
import { parseStringify } from "../utils";
import { InputFile } from "node-appwrite/file";

export const createUser = async (user: CreateUserParams) => {
    try {
        const newUser = await users.create(
            ID.unique(),
            user.email,
            user.phone,
            undefined, 
            user.name
        );
        return newUser; // Return the created user
    } catch (error: any) {
        if (error && error?.code === 409) {
            const documents = await users.list([
                Query.equal("email", [user.email])
            ]);
            return documents?.users[0];
        } else {
            console.error("Error creating user:", error);
            throw error; // Rethrow to ensure the calling function can handle it
        }
    }
};

export const getUser = async (userId: string) => {
    try {
        const user = await users.get(userId);
        return parseStringify(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        throw error; // Rethrow to ensure the calling function can handle it
    }
};

export const getPatient = async (userId: string) => {
    try {
        const patients = await databases.listDocuments(
            DATABASAE_ID!,
            PATIENT_COLLECTION_ID!,
            [Query.equal('userId', userId)]
        );
        return parseStringify(patients.documents[0]);
    } catch (error) {
        console.error("Error fetching patient:", error);
        throw error; // Rethrow to ensure the calling function can handle it
    }
};

export const registerPatient = async (
    { identificationDocument, ...patient }: RegisterUserParams) => {
    try {
        let file;

        if (identificationDocument) {
            const inputFile = InputFile.fromBuffer(
                identificationDocument?.get("blobFile") as Blob,
                identificationDocument?.get("fileName") as string
            );

            file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
        }

        const newPatient = await databases.createDocument(
            DATABASAE_ID!, 
            PATIENT_COLLECTION_ID!,
            ID.unique(),
            {
                identificationDocumentId: file?.$id || null,
                identificationDocumentUrl: file ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}` : null,
                ...patient
            }
        );

        return parseStringify(newPatient);
    } catch (error) {
        console.error("Error registering patient:", error);
        throw error; // Rethrow to ensure the calling function can handle it
    }
};
