import sys
from datetime import datetime
from pytz import timezone
import pytz

def check_banned_names(request):
	banned_names = ['php', 'db', 'sql', 'admin', 'pma', 'robot', 'hat', 'shell']
	for name in banned_names:
		if (request.lower().find(name) > 0):
			return True
	return False

def should_track(request):
	notTrack = ['css', 'jpg', 'mkv', 'mp4', 'strobemedia']
	for name in notTrack:
		if (request.lower().find(name) > 0):
			return False
	return True

if (check_banned_names(sys.argv[2])):
	f=open("./blacklist.txt", "a+")
	f.write(sys.argv[1] + "\n")
	f.close()
elif (should_track(sys.argv[2])):
	f=open("./ipAddresses.txt", "a+")
	fmt = "%m/%d/%Y %H:%M:%S"
	time = datetime.now(timezone("US/Pacific"))
	time = time.strftime(fmt)
	f.write("ip: (" + sys.argv[1] + ") path: (" + sys.argv[2] + ") time: (" + time + ")\n\n")
	f.close()
