import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const MESSAGES_MAX_DISPLAY_DURATION = 60000;
let nb_messages = 0;

interface Message { 
  title: string;
  text: string; 
}
interface MessagesState {
  items: Array<Message>;
}
// Adds a message to the store
const createMessage = function (state: MessagesState, severity: string, title: string, text: string) {
  let message: Message = {  
    title,
    text, 
  };
  state.items.push(message);
  state.items = state.items.slice(0);
};
const initialState: MessagesState = {
  items: [],
};
const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    // Creates an error message
    error(state, action: PayloadAction<string>) {
      createMessage(state, "error", "Error", action.payload);
    },
    // Creates an information message
    info(state, action: PayloadAction<string>) {
      createMessage(state, "info", "Information", action.payload);
    },
    // Closes a message
   
  },
});

export const { error, info} = messagesSlice.actions;

export default messagesSlice.reducer;
