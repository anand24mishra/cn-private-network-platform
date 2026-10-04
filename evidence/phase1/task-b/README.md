# Task B — Private DNS

## DNS Server

Rajat
IP: 10.253.140.169
Service: dnsmasq

## DNS Records

app.team1.test -> 10.253.140.31
api.team1.test -> 10.253.140.31

## Clients

Anand and Omved were configured to use:

10.253.140.169

as their DNS resolver.

## Verification

Both private DNS names successfully resolve to the nginx edge IP.

### app.team1.test

10.253.140.31

### api.team1.test

10.253.140.31

## TTL

30 seconds
