import sys
from time import localtime, strftime

if (sys.argv[2].find("css") < 0 and sys.argv[2].find("mkv") < 0 and sys.argv[2].find("mp4") < 0):
	f=open("./ipAddresses.txt", "a+")
	time = strftime("%Y-%m-%d %H:%M:%S", localtime())
	f.write("ip: (" + sys.argv[1] + ") path: (" + sys.argv[2] + ") time: (" + time + ")\n\n")
	f.close()
