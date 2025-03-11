import { getPool } from "../../config/db";
import * as passwords from "../services/passwords";

const createUser = async (user: User): Promise<number> => {
    const conn = await getPool().getConnection();
    const hashedPassword = await passwords.hash(user.password);
    const query = 'INSERT INTO `user` (`email`, `first_name`, `last_name`, `password`) VALUES (?, ?, ?, ?)';
    const [result] = await conn.query(query, [user.email, user.firstName, user.lastName, hashedPassword]);
    const userId = result.insertId;
    await conn.release();
    return userId;
}

const alterUser = async (user: User): Promise<void> => {
    const conn = await getPool().getConnection();
    const query = `
        UPDATE user
        SET email = ?,
            first_name = ?,
            last_name = ?,
            password = ?,
            image_filename = ?
        WHERE id = ?`;
        const imageFilename = user.imageFilename || null;

    await conn.query(query, [user.email, user.firstName, user.lastName, user.password, imageFilename, user.id]);
    await conn.release();
}

const getUserByEmail = async (email: string): Promise<User | null> => {
    const conn = await getPool().getConnection();
    const query = `
        SELECT id, email, first_name as firstName, last_name as lastName, password, auth_token as authToken, image_filename as imageFilename
        FROM user
        WHERE email = ?`;
    const [rows] = await conn.query(query, [email]);
    await conn.release();
    if (rows.length > 0) {
        return rows[0];
    } else {
        return null;
    }
}

const getUserById = async (id: number): Promise<User | null> => {
    const conn = await getPool().getConnection();
    const query = `
        SELECT id, email, first_name as firstName, last_name as lastName, password, auth_token as authToken, image_filename as imageFilename
        FROM user
        WHERE id = ?`;
    const [rows] = await conn.query(query, [id]);
    await conn.release();
    if (rows.length > 0) {
        return rows[0];
    } else {
        return null;
    }
}

const getUserByToken = async (token: string): Promise<User | null> => {
    const conn = await getPool().getConnection();
    const query = `
      SELECT id, email, first_name as firstName, last_name as lastName, password, auth_token as authToken, image_filename as imageFilename
      FROM user
      WHERE auth_token = ?`;
    const [rows] = await conn.query(query, [token]);
    await conn.release();
    return rows.length > 0 ? rows[0] : null;
};

const setUserToken = async (user: User, token: string | null): Promise<void> => {
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET auth_token = ? WHERE id = ?';
    await conn.query(query, [token, user.id]);
    await conn.release();
}

export { createUser, getUserByEmail, getUserById, getUserByToken, setUserToken, alterUser };