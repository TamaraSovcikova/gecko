
const registerSocketHandlers = require('../../src/socket/socketHandlers');

describe('Backend (Jest): Socket room assignment', () => {

    test('socket joins room_userId when join event is triggered', () => {

        // GIVEN: A connected socket with a mocked join method
        // AND a mock userId is available

        const mockJoin = jest.fn();
        const mockSocketOn = jest.fn();

        const mockSocket = {
            id: 'socket123',
            join: mockJoin,
            on: mockSocketOn,
        };

        const mockIo = {
            on: jest.fn((event, callback) => {
                if (event === 'connection') {
                    callback(mockSocket);
                }
            }),
        };

        // WHEN: The socket handlers are registered

        registerSocketHandlers(mockIo);

        // AND the frontend emits the join event with a userId

        const joinHandler = mockSocketOn.mock.calls.find(
            (call) => call[0] === 'join'
        )[1];

        joinHandler('testUser123');

        // THEN: The socket should join the correct user-specific room

        expect(mockJoin).toHaveBeenCalledWith('room_testUser123');
    });
});