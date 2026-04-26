import { RiPhoneFill, RiVidiconFill, RiTimeLine } from 'react-icons/ri';

function CallMessage({
  isOutgoing = false,
  callType = 'audio',
  status = 'ended',
  duration = 0,
  timestamp,
  showAvatar = false,
  avatar = '',
  username = '',
}) {
  const isMissed = status === 'missed';
  const Icon = callType === 'video' ? RiVidiconFill : RiPhoneFill;

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatTime = (time) => {
    const date = new Date(time);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
      2,
      '0'
    )}`;
  };

  return (
    <div className="conversation-list">
      <div className="message-avatar w-[36px] h-[36px]">
        {showAvatar && avatar && <img src={avatar} alt="avatar" />}
      </div>
      <div className="message-content">
        <div className="list-content">
          <div className="content-item relative">
            <div className="wrap-content select-none call-message-wrapper">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  isMissed
                    ? 'call-missed'
                    : 'call-ended'
                }`}
              >
                <Icon className="text-lg" />
                <div className="flex flex-col">
                  <span className="font-medium capitalize">
                    {isOutgoing ? 'Outgoing' : 'Incoming'} {callType} call
                  </span>
                  {isMissed ? (
                    <span className="text-sm opacity-80">Missed call</span>
                  ) : (
                    <span className="text-sm opacity-80">{formatDuration(duration)}</span>
                  )}
                </div>
              </div>
              {timestamp && (
                <p className="chat-time">
                  <i>
                    <RiTimeLine />
                  </i>
                  <span>{formatTime(timestamp)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
        {showAvatar && username && (
          <div className="message-name text-[14px] font-medium">{username}</div>
        )}
      </div>
    </div>
  );
}

export default CallMessage;
