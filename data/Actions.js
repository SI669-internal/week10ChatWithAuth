

import { initializeApp } from 'firebase/app';
import { setDoc, addDoc, doc, getFirestore,
  getDocs, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

import { firebaseConfig } from '../Secrets';
import { ADD_USER, LOAD_USERS, SET_CURRENT_CHAT } from './Reducer';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let snapshotUnsubsribe = undefined;
let chatSnapshotUnsub = undefined;

const subscribeToUserUpdates = () => {
  if (snapshotUnsubsribe) {
    snapshotUnsubsribe();
  }
  return (dispatch) => {
    snapshotUnsubsribe =  onSnapshot(collection(db, 'users'), usersSnapshot => {
      const updatedUsers = usersSnapshot.docs.map(uSnap => {
        console.log(uSnap.data());
        return uSnap.data(); // already has key?
      });
      dispatch({
        type: LOAD_USERS,
        payload: {
          users: updatedUsers
        }
      });
    });
  }
}

const addUser = (user) => {
  return async (dispatch) => {
    userToAdd = {
      displayName: user.displayName,
      email: user.email,
      key: user.uid
    };
    await setDoc(doc(db, 'users', user.uid), userToAdd);
    // dispatch({
    //   type: ADD_USER,
    //   payload: {
    //     user: {...userToAdd}
    //   }
    // });
  }
}

const addOrSelectChat = (user1id, user2id) => {
 
  return async (dispatch) => {
    
    const chatQuery = query(collection(db, 'chats'),
      where('participants', 'array-contains', user1id),
    );
    const results = await getDocs(chatQuery);
    /*
      Ideally we would do this:
      const chatQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user1id),
        where('participants', 'array-contains', user2id)
      );
      but Firestore doesn't allow more than one 'array-contains'
      where clauses in a single query. So instead we do the 
      second 'array-contains' clause "manually"
    );
    */
    chatSnap = results.docs?.find(
        elem=>elem.data().participants.includes(user2id));
    let theChat;

    if (!chatSnap) { //; we didn't find a match, create a new one
      theChat = {
        participants: [user1id, user2id],
      }
      const chatRef = await addDoc(collection(db, 'chats'), theChat);
      theChat.id = chatRef.id
    } else { // we did find a match, so let's use it.
      theChat = {
        ...chatSnap.data(),
        id: chatSnap.id
      }
    }

    dispatch({
      type: SET_CURRENT_CHAT,
      payload: {
        currentChat: theChat
      }
    }); // initial dispatch

    if (chatSnapshotUnsub) {
      chatSnapshotUnsub();
      chatSnapshotUnsub = undefined;
    }

    const q = query(
      collection(db, 'chats', theChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );
    chatSnapshotUnsub = onSnapshot(
      q, 
      (messagesSnapshot) => {
        const messages = messagesSnapshot.docs.map(msgSnap => {
          const message = msgSnap.data();
          return {
            ...message,
            timestamp: message.timestamp.seconds,
            id: msgSnap.id
          }
        });
        dispatch({
          type: SET_CURRENT_CHAT,
          payload: {
            currentChat: {
              ...theChat,
              messages: messages
            }
          }
        })
      }
    );
  }
}

const addCurrentChatMessage = (message) => {
  return async (dispatch, getState) => {
    const currentChat = getState().currentChat;
    const messageCollection = collection(db, 'chats', currentChat.id, 'messages');
    await addDoc(messageCollection, message); // no need to dispatch
  }
}

export { addUser, subscribeToUserUpdates, addOrSelectChat, addCurrentChatMessage }