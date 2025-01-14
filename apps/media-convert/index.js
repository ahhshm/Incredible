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

const { CompleteHandler } = require('./utils.js')

exports.handler = async event => {
	if (event.detail.queue !== process.env.MEDIA_QUEUE_ARN) {
		console.log('Invalid queue event. Skipping. eventdata = ', event)
		return
	}

	switch (event.detail.status) {
		case 'INPUT_INFORMATION':
			console.log(
				'jobId:' + event.detail.jobId + ' Transcoder has read the input info'
			)
			break

		case 'PROGRESSING':
			console.log('jobId:' + event.detail.jobId + ' progressing .... ')
			break

		case 'COMPLETE':
			console.log(
				'jobId:' + event.detail.jobId + ' successfully completed job.'
			)

			console.log('Detail : ', event.detail, '\t type = ', typeof event.detail)
			await CompleteHandler(event.detail.userMetadata)
			break

		case 'ERROR':
			console.log('jobId:' + event.detail.jobId + 'ERROR: ', event)
			break
	}

	return
}
