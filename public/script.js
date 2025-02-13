// Store names and their confirmation status
const namesData = new Map();
let audioElement = null;
let mediaStream = null;

function logToolCall(functionName, parameters, result) {
	const toolLog = document.getElementById('toolLog');
	const logEntry = document.createElement('div');
	logEntry.className = 'tool-call';
	
	const timestamp = new Date().toLocaleTimeString();
	const success = result.success !== false;
	
	logEntry.innerHTML = `
		<div class="timestamp">${timestamp}</div>
		<div class="function-name">${functionName}</div>
		<div class="parameters">${JSON.stringify(parameters, null, 2)}</div>
		<div class="result ${success ? 'success' : 'error'}">
			${JSON.stringify(result, null, 2)}
		</div>
	`;
	
	toolLog.insertBefore(logEntry, toolLog.firstChild);
	
	// Keep only the last 50 entries
	while (toolLog.children.length > 50) {
		toolLog.removeChild(toolLog.lastChild);
	}
	
	// Scroll the new entry into view
	logEntry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateNamesList() {
	const tbody = document.getElementById('namesTableBody');
	tbody.innerHTML = '';
	
	for (const [name, data] of namesData) {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${name}</td>
			<td>${data.confirmed ? '✅ Confirmed' : '❌ Not Confirmed'}</td>
			<td>${new Date(data.lastUpdated).toLocaleString()}</td>
		`;
		tbody.appendChild(row);
	}
}

const fns = {
	insertName: ({ name }) => {
		const result = (() => {
			const lowerName = name.toLowerCase();
			
			// Check if name already exists
			if (namesData.has(lowerName)) {
				return {
					success: false,
					error: `Name '${name}' already exists in the list`
				};
			}

			// Insert new name (always unconfirmed initially)
			namesData.set(lowerName, {
				confirmed: false,
				lastUpdated: new Date().toISOString()
			});
			
			updateNamesList();
			return {
				success: true,
				insertedName: name,
				totalNames: namesData.size
			};
		})();
		
		logToolCall('insertName', { name }, result);
		return result;
	},
	deleteName: ({ name }) => {
		const result = (() => {
			const lowerName = name.toLowerCase();
			
			// Check if name exists
			if (!namesData.has(lowerName)) {
				return {
					success: false,
					error: `Name '${name}' not found in the list`
				};
			}

			// Delete the name
			namesData.delete(lowerName);
			updateNamesList();
			
			return {
				success: true,
				deletedName: name,
				totalNames: namesData.size
			};
		})();
		
		logToolCall('deleteName', { name }, result);
		return result;
	},
	updateName: ({ currentName, newName }) => {
		const result = (() => {
			const lowerCurrentName = currentName.toLowerCase();
			const lowerNewName = newName.toLowerCase();
			
			// Check if current name exists
			const existing = namesData.get(lowerCurrentName);
			if (!existing) {
				return {
					success: false,
					error: `Name '${currentName}' not found in the list`
				};
			}

			// Check if new name already exists (unless it's the same name)
			if (lowerNewName !== lowerCurrentName && namesData.has(lowerNewName)) {
				return {
					success: false,
					error: `Name '${newName}' already exists in the list`
				};
			}

			// Keep confirmation status but update the name
			const confirmationStatus = existing.confirmed;
			namesData.delete(lowerCurrentName);
			namesData.set(lowerNewName, {
				confirmed: confirmationStatus,
				lastUpdated: new Date().toISOString()
			});
			
			updateNamesList();
			return { 
				success: true, 
				previousName: currentName,
				newName: newName,
				totalNames: namesData.size
			};
		})();
		
		logToolCall('updateName', { currentName, newName }, result);
		return result;
	},
	confirmName: ({ name }) => {
		const result = (() => {
			const lowerName = name.toLowerCase();
			
			// Check if name exists
			const existing = namesData.get(lowerName);
			if (!existing) {
				return {
					success: false,
					error: `Name '${name}' not found in the list`
				};
			}

			// Update confirmation status
			namesData.set(lowerName, {
				confirmed: true,
				lastUpdated: new Date().toISOString()
			});
			
			updateNamesList();
			return {
				success: true,
				confirmedName: name,
				totalNames: namesData.size
			};
		})();
		
		logToolCall('confirmName', { name }, result);
		return result;
	},
	getNames: () => {
		const result = (() => {
			const names = Array.from(namesData.entries()).map(([name, data]) => ({
				name,
				confirmed: data.confirmed,
				lastUpdated: data.lastUpdated
			}));
			return {
				success: true,
				names
			};
		})();
		
		logToolCall('getNames', {}, result);
		return result;
	},
	endConversation: ({ finalMessage }) => {
		const result = (() => {
			const confirmedCount = Array.from(namesData.values()).filter(data => data.confirmed).length;
			const unconfirmedCount = namesData.size - confirmedCount;
			
			// Clean up WebRTC and audio
			if (mediaStream) {
				mediaStream.getTracks().forEach(track => track.stop());
				mediaStream = null;
			}
			
			if (audioElement) {
				audioElement.srcObject = null;
				audioElement.remove();
				audioElement = null;
			}
			
			if (peerConnection) {
				peerConnection.close();
			}
			
			if (dataChannel) {
				dataChannel.close();
			}
			
			return {
				success: true,
				summary: {
					totalNames: namesData.size,
					confirmedNames: confirmedCount,
					unconfirmedNames: unconfirmedCount,
					finalMessage: finalMessage
				}
			};
		})();
		
		logToolCall('endConversation', { finalMessage }, result);
		return result;
	}
};

// Helper function to configure tools
function configureTools() {
	return [
		{
			type: 'function',
			name: 'insertName',
			description: 'Add a new name to the list. Will not modify existing names.',
			parameters: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						description: 'The name of the person to add'
					}
				},
				required: ['name']
			},
		},
		{
			type: 'function',
			name: 'deleteName',
			description: 'Delete a name from the list',
			parameters: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						description: 'The name of the person to delete from the list'
					}
				},
				required: ['name']
			},
		},
		{
			type: 'function',
			name: 'updateName',
			description: 'Update an existing name in the list',
			parameters: {
				type: 'object',
				properties: {
					currentName: { 
						type: 'string', 
						description: 'The current name of the person in the list'
					},
					newName: {
						type: 'string',
						description: 'The new name to change to'
					}
				},
				required: ['currentName', 'newName']
			},
		},
		{
			type: 'function',
			name: 'confirmName',
			description: 'Mark a name as confirmed in the list',
			parameters: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						description: 'The name of the person to confirm'
					}
				},
				required: ['name']
			},
		},
		{
			type: 'function',
			name: 'getNames',
			description: 'Get the current list of all names and their confirmation status',
			parameters: {
				type: 'object',
				properties: {}
			},
		},
		{
			type: 'function',
			name: 'endConversation',
			description: 'End the conversation with a final message and close the connection',
			parameters: {
				type: 'object',
				properties: {
					finalMessage: {
						type: 'string',
						description: 'A final message to display before ending the conversation'
					}
				},
				required: ['finalMessage']
			},
		}
	];
}

// Create a WebRTC Agent
const peerConnection = new RTCPeerConnection();

// On inbound audio add to page
peerConnection.ontrack = (event) => {
	console.log('Received audio track');
	mediaStream = event.streams[0];
	
	// Remove any existing audio element
	const container = document.getElementById('audioContainer');
	container.innerHTML = '';
	
	// Create new audio element
	const el = document.createElement('audio');
	el.srcObject = mediaStream;
	el.autoplay = true;
	el.controls = true;
	
	// Add to page
	container.appendChild(el);
	audioElement = el;
};

const dataChannel = peerConnection.createDataChannel('oai-events');

function configureData() {
	console.log('Configuring data channel');
	const event = {
		type: 'session.update',
		session: {
			modalities: ['text', 'audio'],
			tools: configureTools()
		}
	};
	dataChannel.send(JSON.stringify(event));
}

dataChannel.addEventListener('open', (ev) => {
	console.log('Opening data channel', ev);
	configureData();
});

// {
//     "type": "response.function_call_arguments.done",
//     "event_id": "event_Ad2gt864G595umbCs2aF9",
//     "response_id": "resp_Ad2griUWUjsyeLyAVtTtt",
//     "item_id": "item_Ad2gsxA84w9GgEvFwW1Ex",
//     "output_index": 1,
//     "call_id": "call_PG12S5ER7l7HrvZz",
//     "name": "get_weather",
//     "arguments": "{\"location\":\"Portland, Oregon\"}"
// }

dataChannel.addEventListener('message', async (ev) => {
	const msg = JSON.parse(ev.data);
	// Handle function calls
	if (msg.type === 'response.function_call_arguments.done') {
		const fn = fns[msg.name];
		if (fn !== undefined) {
			console.log(`Calling local function ${msg.name} with ${msg.arguments}`);
			const args = JSON.parse(msg.arguments);
			const result = await fn(args);
			console.log('result', result);
			// Let OpenAI know that the function has been called and share it's output
			const event = {
				type: 'conversation.item.create',
				item: {
					type: 'function_call_output',
					call_id: msg.call_id, // call_id from the function_call message
					output: JSON.stringify(result), // result of the function
				},
			};
			dataChannel.send(JSON.stringify(event));
			// Have assistant respond after getting the results
			dataChannel.send(JSON.stringify({type:"response.create"}));
		}
	}
});

// Capture microphone
navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
	// Add microphone to PeerConnection
	stream.getTracks().forEach((track) => peerConnection.addTransceiver(track, { direction: 'sendrecv' }));

	peerConnection.createOffer().then((offer) => {
		peerConnection.setLocalDescription(offer);
		fetch('/session')
			.then((tokenResponse) => tokenResponse.json())
			.then((data) => {
				const EPHEMERAL_KEY = data.result.client_secret.value;
				const baseUrl = 'https://api.openai.com/v1/realtime';
				const model = 'gpt-4o-realtime-preview';
				fetch(`${baseUrl}?model=${model}`, {
					method: 'POST',
					body: offer.sdp,
					headers: {
						Authorization: `Bearer ${EPHEMERAL_KEY}`,
						'Content-Type': 'application/sdp',
					},
				})
					.then((r) => r.text())
					.then((answer) => {
						// Accept answer from Realtime WebRTC API
						peerConnection.setRemoteDescription({
							sdp: answer,
							type: 'answer',
						});
					});
			});

		// Send WebRTC Offer to Workers Realtime WebRTC API Relay
	});
});
