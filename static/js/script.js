// --- script.js ---

// 1. Initialize Supabase
const supabaseUrl = 'https://rtgaayazrxbggwhpugeg.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Z2FheWF6cnhiZ2d3aHB1Z2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjE0MTksImV4cCI6MjA4MTY5NzQxOX0.9Nk5-Gtg-1vg91qL_meMnHKBD7Hcj6mTPbYzMKPtvl0';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let myUsername = "";

async function joinChat() {
    const usernameInput = document.getElementById('username').value;
    const keyInput = document.getElementById('room-key').value;

    if (!usernameInput || !keyInput) {
        alert("Please enter a name and secret key!");
        return;
    }

    myUsername = usernameInput;
    document.getElementById('user-display').innerText = `Captain ${myUsername}`;
    
    // Generate Security Key
    cryptoKey = await deriveKey(keyInput);

    // Switch Screens
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');

    // Load initial messages
    fetchMessages();

    // Subscribe to Realtime changes
    supabase.channel('custom-all-channel')
    .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
            displayMessage(payload.new);
        }
    )
    .subscribe();
}

async function fetchMessages() {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

    if (error) console.error("Error loading messages:", error);
    else {
        document.getElementById('message-area').innerHTML = ''; // Clear
        data.forEach(displayMessage);
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value;
    if (!text) return;

    // ENCRYPT BEFORE SENDING
    const encryptedContent = await encryptMessage(text);

    const { error } = await supabase
        .from('messages')
        .insert({ username: myUsername, content: encryptedContent });

    if (error) alert("Error sending message");
    else input.value = '';
}

async function displayMessage(msg) {
    const messageArea = document.getElementById('message-area');
    
    // DECRYPT MESSAGE
    const decryptedText = await decryptMessage(msg.content);

    const div = document.createElement('div');
    const isMe = msg.username === myUsername;
    
    div.classList.add('message');
    div.classList.add(isMe ? 'my-message' : 'other-message');

    div.innerHTML = `
        <span class="msg-sender">${isMe ? 'You' : msg.username}</span>
        ${decryptedText}
    `;

    messageArea.appendChild(div);
    messageArea.scrollTop = messageArea.scrollHeight; // Auto scroll to bottom
}

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}
