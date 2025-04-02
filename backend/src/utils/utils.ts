const createInviteRoomCode = () => {
   const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
   const randomLetter = letters[Math.floor(Math.random() * letters.length)];
   // Generate 3 more characters from alphanumerics
   const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
   return randomLetter + randomPart;
}

export default createInviteRoomCode;