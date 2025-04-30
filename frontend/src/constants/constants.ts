const SOCKET_CONNECTION_ERROR = "Socket connection error: ";
const NAME_ERROR = "Please enter your name";

const ROOM_CREATED_SUCCESS = "Room created successfully!";
const ROOM_CODE_COPIED = "Room code copied to clipboard!";
const ROOM_JOINED_SUCCESS = "Room joined successfully!";
const ROOM_REJOINED_SUCCESS = "Room rejoined successfully!";
const ROOM_LEFT_SUCCESS = "Player left!";
const ROOM_NOT_FOUND_ERROR = "Room code invalid or expired, redirecting to home page...";
const ROOM_LENGTH_ERROR = "Room code must have 4 characters";

const SOCKET_CONNECTED = "Socket connected successfully!";
const SOCKET_DISCONNECTED = "Socket disconnected";
const SOCKET_RECONNECTED = "Socket reconnected successfully!";
const SOCKET_PROVIDER_ERROR = "useSocket must be used within a SocketProvider";

const ROOM_CODE_LENGTH = 4;

const PLACEHOLDER_NAME = "Enter your Name";
const PLACEHOLDER_ROOM_CODE = "Enter Room Code";

const TITLE_ROOM_CODE = "Create/Enter Room Code";


const RECOVERY_TIMEOUT = 20000; // 20 seconds timeout for recovery
const RECOVERY_TIMER_STARTED = "Server acknowledged player left. Starting recovery timer.";
const RECOVERY_GRACE_PERIOD_EXPIRED = "Recovery grace period expired. Redirecting to home page...";

const CONFIRM_NAVIGATION_MESSAGE = "Are you sure you want to leave? You will lose your progress.";
const TIMEOUT_WARNING = "Room will be closed in 20 seconds, rejoin to prevent losing progress.";

const BUTTON_CREATE_ROOM = "Create Room";
const BUTTON_JOIN_ROOM = "Join Room";
const BUTTON_PLAY_WITH_FRIEND = "Play with Friend";
const BUTTON_PLAY_WITH_AI = "Play with AI";
const PLAY_AI = "Play with AI not implemented yet";

const NEW_PLAYER_JOINED = "A player has joined the room: ";
const PLAYER_LEFT = "A player left the room: ";

// Exporting constants for use in other parts of the application
export {
    ROOM_LENGTH_ERROR,
    ROOM_NOT_FOUND_ERROR,
    SOCKET_CONNECTION_ERROR,
    NAME_ERROR,
    ROOM_CREATED_SUCCESS,
    ROOM_JOINED_SUCCESS,
    ROOM_REJOINED_SUCCESS,
    ROOM_LEFT_SUCCESS,
    ROOM_CODE_COPIED,
    ROOM_CODE_LENGTH,
    SOCKET_CONNECTED,
    SOCKET_DISCONNECTED,
    SOCKET_RECONNECTED,
    SOCKET_PROVIDER_ERROR,
    PLACEHOLDER_NAME,
    PLACEHOLDER_ROOM_CODE,
    TITLE_ROOM_CODE,
    RECOVERY_TIMEOUT,
    RECOVERY_TIMER_STARTED,
    RECOVERY_GRACE_PERIOD_EXPIRED,
    CONFIRM_NAVIGATION_MESSAGE,
    TIMEOUT_WARNING,
    BUTTON_CREATE_ROOM,
    BUTTON_JOIN_ROOM,
    BUTTON_PLAY_WITH_FRIEND,
    BUTTON_PLAY_WITH_AI,
    PLAY_AI,
    NEW_PLAYER_JOINED,
    PLAYER_LEFT
};