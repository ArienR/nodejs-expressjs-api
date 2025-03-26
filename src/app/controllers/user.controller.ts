import { Request, Response } from "express";
import crypto from 'crypto';
import Logger from '../../config/logger';
import { createUser, getUserByEmail, getUserById, getUserByToken, setUserToken, alterUser } from "../models/user.models";
import { validate } from "../services/validator";
import * as schemas from '../resources/schemas.json';
import * as passwords from "../services/passwords";

const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const isValid = await validate(
            schemas.user_register,
            req.body
        );
        if (isValid !== true) {
            res.status(400).send();
            return;
        }
        const isEmailInUse = await getUserByEmail(req.body.email);
        if (isEmailInUse !== null) {
            res.status(403).send();
            return;
        }
        const {email, firstName, lastName, password} = req.body as User;
        const newUserId = await createUser({email, firstName, lastName, password});
        res.status(201).send({userId: newUserId});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await getUserByEmail(req.body.email);
        if (user === null) {
            res.status(400).send();
            return;
        }
        const passwordMatches = await passwords.compare(req.body.password, user.password);
        if (!passwordMatches) {
            res.status(401).send();
            return;
        }
        const token = crypto.randomBytes(16).toString('hex');
        await setUserToken(user, token);
        res.status(200).send({userId: user.id, token});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.header('x-authorization') || req.headers.authorization;
        if (!authHeader) {
            res.status(401).send()
            return;
        }
        let token: string;
        if (typeof authHeader === 'string') {
            token = authHeader.includes(' ') ? authHeader.split(' ')[1] : authHeader;
        } else {
            // If not a string, try to cast it to a string.
            token = String(authHeader);
        }

        if (!token) {
            res.status(401).send();
            return;
        }
        const user = await getUserByToken(token);
        if(!user) {
            res.status(401).send();
            return;
        }
        await setUserToken(user, null);
        res.status(200).send({userId: user.id, token});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.status(400).send({ error: "Invalid user ID" });
            return;
        }
        const user = await getUserById(userId);
        if (user === null) {
            res.status(404).send();
            return;
        }
        let authUserId: number | null = null;
        const authHeader = req.header('x-authorization') || req.headers.authorization;
        if (authHeader && typeof authHeader === "string") {
            const authUser = await getUserByToken(authHeader);
            if (authUser) {
                authUserId = authUser.id!;
            }
        }
        if (authUserId === userId) {
            res.status(200).send({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            });
        } else {
            res.status(200).send({
                firstName: user.firstName,
                lastName: user.lastName
            });
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.header('x-authorization') || req.headers.authorization;
        if (!authHeader) {
            res.status(401).send();
            return;
        }
        const token = authHeader as string;
        const authUser = await getUserByToken(token);
        if (!authUser) {
            res.status(401).send();
            return;
        }
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.status(400).send();
            return;
        }
        if (authUser.id !== userId) {
            res.status(403).send({ error: "Can not edit another user's information" });
            return;
        }
        const currentUser = await getUserById(userId);
        if (!currentUser) {
            res.status(404).send();
            return;
        }
        const isValid = await validate(schemas.user_edit, req.body);
        if (isValid !== true) {
            res.status(400).send();
            return;
        }
        // Checks if the user trying to change their email and if the email is different to their current one
        if (req.body.email) {
            // If the provided email is the same as the current email, reject the update.
            if (req.body.email === authUser.email) {
                res.status(403).json({ error: "Cannot update with the same email as current" });
                return;
            }
            // Otherwise, check if the new email is already in use by another user.
            const userByEmail = await getUserByEmail(req.body.email);
            if (userByEmail && userByEmail.id !== authUser.id) {
                res.status(403).json({ error: "Email already in use" });
                return;
            }
        }

        if (req.body.password || req.body.currentPassword) {
            if (!req.body.password || !req.body.currentPassword) {
                res.status(400).send();
                return;
            }
            const {currentPassword, password} = req.body;
            if (currentPassword === password) {
                res.status(403).send({ error: "Old and new passwords match" });
                return;
            }
            const passwordMatches = await passwords.compare(currentPassword, currentUser.password);
            if (!passwordMatches) {
                res.status(401).send({ error: "Incorrect password" });
                return;
            }
            req.body.password = await passwords.hash(password);
        }
        const updatedUser = {...currentUser, ...req.body};
        await alterUser(updatedUser);
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export { register, login, view, logout, update }