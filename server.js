const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('youtube-dl-exec');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const server = http.createServer(app);

// Configuración de CORS para Express
app.use(cors());

const io = socketIo(server, {
    cors: {
        origin: "*", // Permitir cualquier origen
        methods: ["GET", "POST"]
    }
});

let playlist = [];
let currentSongIndex = -1;
let currentTime = 0;
let isPlaying = false;
let interval;

app.get('/download', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        // Obtener información del video de YouTube
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title;
        const artist = info.videoDetails.author.name;
        const videoId = info.videoDetails.videoId;
        const audioPath = `public/${videoId}.mp3`;
        console.log(info)
        // Descargar y convertir el video a MP3
        const audioStream = ytdl(url, { filter: 'audioonly' });

        exec(url, {
            extractAudio: true,
            audioFormat: 'mp3', // Cambiado a 'mp3'
            output: audioPath,
            ffmpegLocation: ffmpegPath,
        })
        .then(outputPath => {
            // Verificar si la canción ya está en la lista de reproducción
            const existingSongIndex = playlist.findIndex(song => song.title === title && song.artist === artist);
            if (existingSongIndex === -1) {
                // Agregar la canción a la lista de reproducción si no está duplicada
                playlist.push({ title, artist, audioPath: `${videoId}.mp3` });
            }
            
            if (currentSongIndex === -1) {
                // Si no hay ninguna canción en reproducción, reproducir la nueva canción
                currentSongIndex = 0;
                playCurrentSong();
            }

            // Enviar la respuesta como JSON
            res.json({ title, artist, audio_path: `${videoId}.mp3` });
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process the YouTube URL' });
    }
});



// app.get('/download', async (req, res) => {
//     const url = req.query.url;
//     if (!url) {
//         return res.status(400).json({ error: 'URL parameter is required' });
//     }

//     try {
//         // Obtener información del video de YouTube
//         const info = await ytdl.getInfo(url);
//         const title = info.videoDetails.title;
//         const artist = info.videoDetails.author.name;
//         const videoId = info.videoDetails.videoId;
//         const videoPath = `public/${videoId}.mp4`;

//         // Descargar el video en formato MP4
//         exec(url, {
//             format: 'mp4', // Cambiado a 'mp4' para descargar video
//             output: videoPath,
//             ffmpegLocation: ffmpegPath,
//         })
//         .then(outputPath => {
//             // Verificar si la canción ya está en la lista de reproducción
//             const existingSongIndex = playlist.findIndex(song => song.title === title && song.artist === artist);
//             if (existingSongIndex === -1) {
//                 // Agregar la canción a la lista de reproducción si no está duplicada
//                 playlist.push({ title, artist, audioPath: `${videoId}.mp4` });
//             }

//             if (currentSongIndex === -1) {
//                 // Si no hay ninguna canción en reproducción, reproducir la nueva canción
//                 currentSongIndex = 0;
//                 playCurrentSong();
//             }

//             // Enviar la respuesta como JSON
//             res.json({ title, artist, video_path: `${videoId}.mp4` });
//         })
//         .catch(error => {
//             console.error('Error al descargar el video:', error);
//             res.status(500).json({ error: 'Failed to download the YouTube video' });
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to process the YouTube URL' });
//     }
// });


// app.get('/download', async (req, res) => {
//     const url = req.query.url;
//     if (!url) {
//         return res.status(400).json({ error: 'URL parameter is required' });
//     }

//     try {
//         // Obtener información del video de YouTube
//         const info = await ytdl.getInfo(url);
//         const title = info.videoDetails.title;
//         const artist = info.videoDetails.author.name;
//         const videoId = info.videoDetails.videoId;
//         const videoPath = `public/${videoId}.mp4`;

//         // Descargar el video en la mejor calidad disponible
//         exec(url, {
//             format: 'bestvideo+bestaudio/best', // Descargar la mejor calidad de video y audio
//             output: videoPath,
//             ffmpegLocation: ffmpegPath,
//         })
//         .then(outputPath => {
//             // Verificar si la canción ya está en la lista de reproducción
//             const existingSongIndex = playlist.findIndex(song => song.title === title && song.artist === artist);
//             if (existingSongIndex === -1) {
//                 // Agregar la canción a la lista de reproducción si no está duplicada
//                 playlist.push({ title, artist, videoPath: `${videoId}.mp4` });
//             }

//             if (currentSongIndex === -1) {
//                 // Si no hay ninguna canción en reproducción, reproducir la nueva canción
//                 currentSongIndex = 0;
//                 playCurrentSong();
//             }

//             // Enviar la respuesta como JSON
//             res.json({ title, artist, video_path: `${videoId}.mp4` });
//         })
//         .catch(error => {
//             console.error('Error al descargar el video:', error);
//             res.status(500).json({ error: 'Failed to download the YouTube video' });
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to process the YouTube URL' });
//     }
// });


// app.get('/download', async (req, res) => {
//     const url = req.query.url;
//     if (!url) {
//         return res.status(400).json({ error: 'URL parameter is required' });
//     }

//     try {
//         // Obtener información del video de YouTube
//         const info = await ytdl.getInfo(url);
//         const title = info.videoDetails.title;
//         const artist = info.videoDetails.author.name;
//         const videoId = info.videoDetails.videoId;
//         const videoPath = `public/${videoId}.mp4`;

//         // Descargar el video en la mejor calidad disponible y forzar la salida en MP4
//         exec(url, {
//             format: 'bestvideo+bestaudio/best', // Descargar la mejor calidad de video y audio
//             output: videoPath,
//             ffmpegLocation: ffmpegPath,
//             mergeOutputFormat: 'mp4', // Forzar la salida en MP4
//         })
//         .then(outputPath => {
//             // Verificar si la canción ya está en la lista de reproducción
//             const existingSongIndex = playlist.findIndex(song => song.title === title && song.artist === artist);
//             if (existingSongIndex === -1) {
//                 // Agregar la canción a la lista de reproducción si no está duplicada
//                 playlist.push({ title, artist, videoPath: `${videoId}.mp4` });
//             }

//             if (currentSongIndex === -1) {
//                 // Si no hay ninguna canción en reproducción, reproducir la nueva canción
//                 currentSongIndex = 0;
//                 playCurrentSong();
//             }

//             // Enviar la respuesta como JSON
//             res.json({ title, artist, video_path: `${videoId}.mp4` });
//         })
//         .catch(error => {
//             console.error('Error al descargar el video:', error);
//             res.status(500).json({ error: 'Failed to download the YouTube video' });
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to process the YouTube URL' });
//     }
// });


// app.get('/download', async (req, res) => {
//     const url = req.query.url;
//     if (!url) {
//         return res.status(400).json({ error: 'URL parameter is required' });
//     }

//     try {
//         // Obtener información del video de YouTube
//         const info = await ytdl.getInfo(url);
//         const title = info.videoDetails.title;
//         const artist = info.videoDetails.author.name;
//         const videoId = info.videoDetails.videoId;
//         const videoPath = `public/${videoId}.mp4`;

//         // Descargar el video en la mejor calidad disponible y forzar la salida en MP4
//         exec(url, {
//             format: 'bestvideo+bestaudio/best', // Descargar la mejor calidad de video y audio
//             output: videoPath,
//             ffmpegLocation: ffmpegPath,
//             mergeOutputFormat: 'mp4', // Forzar la salida en MP4
//             //postprocessorArgs: ['-c:v', 'copy', '-c:a', 'libmp3lame'], // Convertir el audio a AAC para compatibilidad con MP4
//         })
//         .then(outputPath => {
//             // Verificar si la canción ya está en la lista de reproducción
//             const existingSongIndex = playlist.findIndex(song => song.title === title && song.artist === artist);
//             if (existingSongIndex === -1) {
//                 // Agregar la canción a la lista de reproducción si no está duplicada
//                 playlist.push({ title, artist, videoPath: `${videoId}.mp4` });
//             }

//             if (currentSongIndex === -1) {
//                 // Si no hay ninguna canción en reproducción, reproducir la nueva canción
//                 currentSongIndex = 0;
//                 playCurrentSong();
//             }

//             // Enviar la respuesta como JSON
//             res.json({ title, artist, video_path: `${videoId}.mp4` });
//         })
//         .catch(error => {
//             console.error('Error al descargar el video:', error);
//             res.status(500).json({ error: 'Failed to download the YouTube video' });
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to process the YouTube URL' });
//     }
// });

// Servir archivos estáticos
app.use(express.static('public'));

// Ruta para obtener la lista de reproducción
app.get('/playlist', (req, res) => {
    res.json(playlist);
});

io.on('connection', (socket) => {
    if (currentSongIndex !== -1) {
        socket.emit('newSong', playlist[currentSongIndex]);
        socket.emit('syncTime', { time: currentTime, isPlaying: isPlaying });
    }

    socket.on('playSong', (song) => {
        // Verificar si la canción ya está en la lista de reproducción
        const existingSongIndex = playlist.findIndex(s => s.title === song.title && s.artist === song.artist);
        if (existingSongIndex === -1) {
            // Agregar la canción a la lista de reproducción si no está duplicada
            playlist.push(song);
            if (currentSongIndex === -1) {
                currentSongIndex = 0;
                playCurrentSong();
            }
            io.emit('updatePlaylist');
        }
    });

    socket.on('requestSync', () => {
        if (currentSongIndex !== -1) {
            socket.emit('syncTime', { time: currentTime, isPlaying: isPlaying });
        }
    });

    socket.on('play', () => {
        isPlaying = true;
        io.emit('play');
        startSyncing();
    });

    socket.on('stop', () => {
        isPlaying = false;
        io.emit('stop');
        clearInterval(interval);
    });

    // socket.on('seek', (time) => {
    //     currentTime = time;
    //     io.emit('seek', time);
    // });

    socket.on('next', () => {
        if (currentSongIndex < playlist.length - 1) {
            currentSongIndex++;
            playCurrentSong();
        } else {
            stopService(); // Detener el servicio cuando se termine la lista de reproducción
        }
    });

    socket.on('previous', () => {
        if (currentSongIndex > 0) {
            currentSongIndex--;
            playCurrentSong();
        }
    });

    socket.on('songEnded', () => {
        // Eliminar la canción que ha terminado de reproducirse
        if (currentSongIndex !== -1) {
            playlist.splice(currentSongIndex, 1);
            if (currentSongIndex >= playlist.length) {
                currentSongIndex = playlist.length - 1;
            }
            if (currentSongIndex === -1) {
                stopService(); // Detener el servicio si no quedan canciones en la lista
            } else {
                playCurrentSong();
            }
            io.emit('updatePlaylist');
        }
    });
});

function playCurrentSong() {
    const song = playlist[currentSongIndex];
    currentTime = 0;
    isPlaying = true;
    io.emit('newSong', song);
    startSyncing();
}

function startSyncing() {
    clearInterval(interval);
    interval = setInterval(() => {
        if (isPlaying) {
            currentTime++;
            io.emit('syncTime', { time: currentTime, isPlaying: isPlaying });
        }
    }, 1000);
}

function stopService() {
    isPlaying = false;
    currentSongIndex = -1;
    playlist = [];
    clearInterval(interval);
    io.emit('stop');
}

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
