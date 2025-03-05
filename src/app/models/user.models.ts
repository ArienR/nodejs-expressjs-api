import {getPool} from "../../config/db";
import {OkPacket, ResultSetHeader, RowDataPacket} from "mysql2";
import * as passwords from "../services/passwords";
import Logger from '../../config/logger';

interface UserRegisterPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

const registerUser = async (user: UserRegisterPayload): Promise<void> => {
    const conn = await getPool().getConnection();
    try {
        const hashedPassword = await passwords.hash(user.password);
        const query = 'insert into user (?, ?, ?, ?)';
        await conn.query(query, [user.email, user.firstName, user.lastName, hashedPassword]);
    } catch (err) {
        Logger.error(err);
        throw err;
    } finally {
        await conn.release();
    }
}
