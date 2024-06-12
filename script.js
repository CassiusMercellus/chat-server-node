const socket = io('http://localhost:3000')
const messageContainer = document.getElementById('message-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

const name = prompt('What is your name?')
appendMessage('You joined')
socket.emit('new-user', name)

socket.on('chat-message', data => {
    appendMessage(`${data.name}: ${data.message}`)
})

socket.on('user-connected', name => {
    appendMessage(`${name} connected`)
})

socket.on('user-disconnected', name => {
    appendMessage(`${name} disconnected`)
})

socket.on('error-message', error => {
    appendMessage(`Error: ${error}`)
})

socket.on('whisper-message', data => {
    appendMessage(`(Whisper from ${data.from}): ${data.message}`)
})

socket.on('username-changed', newUsername => {
    appendMessage(`Your username has been changed to ${newUsername}`)
})

socket.on('user-changed-username', data => {
    appendMessage(`${data.oldUsername} changed their name to ${data.newUsername}`)
})

socket.on('kicked', message => {
    appendMessage(message)
    socket.disconnect()
})

socket.on('client-list', clientList => {
    appendMessage(`Connected clients: ${clientList}`)
})

messageForm.addEventListener('submit', e => {
    e.preventDefault()
    const message = messageInput.value
    appendMessage(`You: ${message}`)
    socket.emit('send-chat-message', message)
    messageInput.value = ''
})

function appendMessage(message) {
    const messageElement = document.createElement('div')
    messageElement.innerText = message
    messageContainer.append(messageElement)
}
