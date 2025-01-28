const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT;

const bot = new TelegramBot(token, { polling: true });

const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

// Команда /start
bot.onText(/\/start/, (msg) => {
	const chatId = msg.chat.id;
	bot.sendMessage(
		chatId,
		'Привет! Я могу скачивать видео с YouTube. Отправь мне ссылку на видео.'
	);
});

bot.on('message', (msg) => {
	const chatId = msg.chat.id;
	const messageText = msg.text;

	// Проверка на ссылку YouTube
	if (messageText.includes('youtube.com') || messageText.includes('youtu.be')) {
		try {
			const videoId = ytdl.getURLVideoID(messageText);
			const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

			// Путь для сохранения видео
			const mp4DownloadPath = `./video_${videoId}.mp4`;

			// Скачивание видео
			bot.sendMessage(chatId, 'Скачиваю видео...');
			const mp4DownloadStream = ytdl(videoUrl, {
				filter: 'audioandvideo',
				quality: 'highest',
			});
			const mp4FileStream = fs.createWriteStream(mp4DownloadPath);

			mp4DownloadStream.pipe(mp4FileStream);

			mp4DownloadStream.on('end', () => {
				bot.sendMessage(chatId, 'Видео скачано. Отправляю...');

				// Отправляем видео
				bot
					.sendVideo(chatId, mp4DownloadPath, { caption: 'Вот ваше видео!' })
					.then(() => {
						// Удаляем файл после отправки
						fs.unlinkSync(mp4DownloadPath);
					})
					.catch((error) => {
						console.error('Ошибка при отправке видео:', error);
						bot.sendMessage(chatId, 'Произошла ошибка при отправке видео.');
					});
			});

			mp4DownloadStream.on('error', (error) => {
				console.error('Ошибка при скачивании видео:', error);
				bot.sendMessage(chatId, 'Произошла ошибка при скачивании видео.');
			});
		} catch (error) {
			console.error('Ошибка:', error);
			bot.sendMessage(chatId, 'Произошла ошибка при обработке ссылки.');
		}
	} else {
		bot.sendMessage(chatId, 'Пожалуйста, отправьте ссылку на видео с YouTube.');
	}
});
