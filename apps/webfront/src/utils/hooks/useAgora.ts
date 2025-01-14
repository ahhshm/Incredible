// Copyright (c) 2022 Pixelbyte Studio Pvt Ltd
//
// This file is part of Incredible, Pixelbyte Studio Pvt Ltd
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program\.  If not, see <http://www\.gnu\.org/licenses/>\.

/* eslint-disable no-console */
import { createClient } from 'agora-rtc-react'
import AgoraRTC, {
	ClientConfig,
	IAgoraRTCRemoteUser,
	ICameraVideoTrack,
	IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'
import { useState } from 'react'
import { useEnv } from 'utils/src'

export interface RTCUser extends IAgoraRTCRemoteUser {
	audioStream?: MediaStream
	videoStream?: MediaStream
}

export interface LocalAgoraUser {
	uid: string
	hasAudio: boolean
	tracks: [IMicrophoneAudioTrack, ICameraVideoTrack] | null
}

const config: ClientConfig = {
	mode: 'rtc',
	codec: 'h264',
}

const useClient = createClient(config)

const useAgora = () => {
	const { appId } = useEnv().agora

	const client = useClient()
	const [ready, setReady] = useState(false)
	const [users, setUsers] = useState<RTCUser[]>([])
	const [stream, setStream] = useState<MediaStream | null>(null)
	const [currentUser, setCurrentUser] = useState<LocalAgoraUser>({
		uid: '',
		hasAudio: true,
		tracks: null,
	})
	const [channel, setChannel] = useState<string>()

	const [userAudios, setUserAudios] = useState<MediaStream[]>([])

	const init = async (
		agoraChannel: string,
		{
			onTokenWillExpire,
			onTokenDidExpire,
		}: { onTokenWillExpire: () => void; onTokenDidExpire: () => void },
		{
			uid,
			tracks,
			hasAudio,
		}: {
			uid: string
			tracks: [IMicrophoneAudioTrack, ICameraVideoTrack]
			hasAudio: boolean
		}
	) => {
		try {
			setReady(false)
			setChannel(agoraChannel)
			setCurrentUser({
				uid,
				hasAudio,
				tracks,
			})

			setStream(
				new MediaStream([
					tracks[0].getMediaStreamTrack(),
					tracks[1].getMediaStreamTrack(),
				])
			)

			client.on('user-published', async (user, mediaType) => {
				await client.subscribe(user, mediaType)
				const remoteTracks: MediaStreamTrack[] = []
				if (user.audioTrack)
					remoteTracks.push(user.audioTrack?.getMediaStreamTrack())
				if (user.videoTrack)
					remoteTracks.push(user.videoTrack?.getMediaStreamTrack())
				if (mediaType === 'video') {
					setUsers(prevUsers => {
						if (prevUsers.find(element => element.uid === user.uid))
							return [...prevUsers]
						return [
							...prevUsers,
							{
								...user,
								mediaStream:
									remoteTracks && remoteTracks.length > 0
										? // @ts-ignore
										  new MediaStream(remoteTracks.filter(track => !!track))
										: undefined,
							},
						]
					})
				}
				if (mediaType === 'audio') {
					user.audioTrack?.play()
					setUserAudios(prev => [
						...prev,
						new MediaStream([
							user.audioTrack?.getMediaStreamTrack() as MediaStreamTrack,
						]),
					])
				}
			})

			client.on('user-left', user => {
				setUsers(prevUsers => prevUsers.filter(User => User.uid !== user.uid))
			})

			client.on('user-info-updated', (user, msg) => {
				setUsers(prevUsers =>
					prevUsers.map(User => {
						if (User.uid === user) {
							return {
								...User,
								hasAudio: msg !== 'mute-audio',
							}
						}
						return User
					})
				)
			})

			client.on('token-privilege-will-expire', () => {
				onTokenWillExpire()
			})

			client.on('token-privilege-did-expire', () => {
				onTokenDidExpire()
			})
			setReady(true)
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	AgoraRTC.onMicrophoneChanged = async changedDevice => {
		if (!currentUser) return
		if (changedDevice.state === 'ACTIVE') {
			await currentUser.tracks?.[0]?.setDevice(changedDevice.device.deviceId)
			// Switch to an existing device when the current device is unplugged.
		} else if (
			changedDevice.device.label === currentUser.tracks?.[0]?.getTrackLabel()
		) {
			const oldMicrophones = await AgoraRTC.getMicrophones()
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			await currentUser.tracks[0]?.setDevice(oldMicrophones?.[0]?.deviceId)
		}
	}

	AgoraRTC.onCameraChanged = async changedDevice => {
		if (changedDevice.state === 'ACTIVE') {
			await currentUser.tracks?.[1].setDevice(changedDevice.device.deviceId)
			// Switch to an existing device when the current device is unplugged.
		} else if (
			changedDevice.device.label === currentUser.tracks?.[0].getTrackLabel()
		) {
			const oldCameras = await AgoraRTC.getCameras()
			await currentUser.tracks?.[1].setDevice(oldCameras?.[0]?.deviceId)
		}
	}

	const renewToken = async (token: string) => {
		client.renewToken(token)
	}

	const join = async (
		token: string,
		uid: string,
		mediaTracks: [IMicrophoneAudioTrack, ICameraVideoTrack] | null
	) => {
		try {
			if (!channel || !ready) return
			await client.join(appId, channel, token, uid)
			if (mediaTracks) await client.publish(mediaTracks)
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	const setMicrophoneDevice = async (deviceId: string) => {
		if (!currentUser.tracks) return
		await currentUser.tracks?.[0]?.setDevice(deviceId)
		setStream(
			new MediaStream([
				currentUser.tracks[0].getMediaStreamTrack(),
				currentUser.tracks[1].getMediaStreamTrack(),
			])
		)
	}

	const setCameraDevice = async (deviceId: string) => {
		if (!currentUser.tracks) return
		console.log('studio camera')
		await currentUser.tracks?.[1]?.setDevice(deviceId)
		setStream(
			new MediaStream([
				currentUser.tracks[0].getMediaStreamTrack(),
				currentUser.tracks[1].getMediaStreamTrack(),
			])
		)
	}

	const mute = async () => {
		try {
			if (!ready) return
			await currentUser?.tracks?.[0]?.setEnabled(!currentUser.hasAudio)
			// currentUser?.audioTrack.setEnabled(false)
			setCurrentUser(prev => ({
				...prev,
				hasAudio: !prev.hasAudio,
			}))
		} catch (error) {
			console.error(error)
		}
	}

	const leave = async () => {
		try {
			if (!ready) return
			currentUser?.tracks?.[0]?.stop()
			currentUser?.tracks?.[1]?.stop()
			users.forEach(user => {
				user.audioTrack?.stop()
				user?.videoTrack?.stop()
			})
			await client.leave()
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	return {
		init,
		ready,
		users,
		stream,
		join,
		mute,
		leave,
		renewToken,
		currentUser,
		setMicrophoneDevice,
		setCameraDevice,
		userAudios,
	}
}

export default useAgora
