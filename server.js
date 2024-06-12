const io = require('socket.io')(3000, {
  cors: {
      origin: true,
  },
})

const users = {}
const adminPassword = 'supersecretpw'

io.on('connection', socket => {
  socket.on('new-user', name => {
      users[socket.id] = name
      socket.broadcast.emit('user-connected', name)
  })

  socket.on('send-chat-message', message => {
      const messageParts = message.split(' ')
      const command = messageParts[0]
    
      switch (command) {
          case '/w':
              handleWhisperCommand(socket, messageParts)
              break
          case '/username':
              handleUsernameCommand(socket, messageParts)
              break
          case '/kick':
              handleKickCommand(socket, messageParts)
              break
          case '/clientlist':
              handleClientListCommand(socket)
              break
          default:
              socket.broadcast.emit('chat-message', { message: message, name: users[socket.id] })
      }
  })

  socket.on('disconnect', () => {
      socket.broadcast.emit('user-disconnected', users[socket.id])
      delete users[socket.id]
  })
})

function handleWhisperCommand(socket, messageParts) {
  if (messageParts.length < 3) {
      socket.emit('error-message', 'Usage: /w <username> <message>')
      return
  }
  const recipientName = messageParts[1]
  const privateMessage = messageParts.slice(2).join(' ')
  const recipientSocketId = Object.keys(users).find(id => users[id] === recipientName)

  if (!recipientSocketId) {
      socket.emit('error-message', `User ${recipientName} not found`)
  } else if (recipientSocketId === socket.id) {
      socket.emit('error-message', 'You cannot whisper to yourself')
  } else {
      io.to(recipientSocketId).emit('whisper-message', { message: privateMessage, from: users[socket.id] })
  }
}

function handleUsernameCommand(socket, messageParts) {
  if (messageParts.length !== 2) {
      socket.emit('error-message', 'Usage: /username <new-username>')
      return
  }
  const newUsername = messageParts[1]

  if (newUsername === users[socket.id]) {
      socket.emit('error-message', 'New username cannot be the same as the old username')
  } else if (Object.values(users).includes(newUsername)) {
      socket.emit('error-message', 'Username already in use')
  } else {
      const oldUsername = users[socket.id]
      users[socket.id] = newUsername
      socket.emit('username-changed', newUsername)
      io.emit('user-changed-username', { oldUsername, newUsername })
  }
}

function handleKickCommand(socket, messageParts) {
  if (messageParts.length !== 3) {
      socket.emit('error-message', 'Usage: /kick <username> <adminPassword>')
      return
  }
  const usernameToKick = messageParts[1]
  const providedPassword = messageParts[2]

  if (providedPassword !== adminPassword) {
      socket.emit('error-message', 'Incorrect admin password')
      return
  }
  const userToKickSocketId = Object.keys(users).find(id => users[id] === usernameToKick)

  if (!userToKickSocketId) {
      socket.emit('error-message', `User ${usernameToKick} not found`)
  } else if (userToKickSocketId === socket.id) {
      socket.emit('error-message', 'You cannot kick yourself')
  } else {
      io.to(userToKickSocketId).emit('kicked', 'You have been kicked from the chat')
      io.emit('user-disconnected', users[userToKickSocketId])
      io.sockets.sockets.get(userToKickSocketId).disconnect()
      delete users[userToKickSocketId]
  }
}

function handleClientListCommand(socket) {
  const clientList = Object.values(users).join(', ')
  socket.emit('client-list', clientList)
}
