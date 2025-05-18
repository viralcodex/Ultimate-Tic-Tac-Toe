
export async function roomCodeExists(roomCode: string): Promise<boolean> {
    const res = await fetch(
        `http://localhost:4000/api/rooms/${roomCode}/exists`,
        {
            cache: "no-store",
            method: "GET",
        }
    );

    if (res.status !== 200) {
        return false;
    }
    return true;
}