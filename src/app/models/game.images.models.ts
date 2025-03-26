import { getPool } from "../../config/db";

const setGameImage = async (gameId: number, imageFilename: string): Promise<void> => {
    const conn = await getPool().getConnection();
    const query = `
      UPDATE game
      SET image_filename = ?
      WHERE id = ?
    `;
    await conn.query(query, [imageFilename, gameId]);
    conn.release();
};

const getGameImage = async (gameId: number): Promise<string | null> => {
    const conn = await getPool().getConnection();
    const query = `
        SELECT image_filename
        FROM game
        WHERE id = ?
    `;
    const [ rows ] = await conn.query(query, [ gameId ]);
    await conn.release();
    return rows[0].image_filename;
}

export { getGameImage, setGameImage }