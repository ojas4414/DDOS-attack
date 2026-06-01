import heapq
import math
import time
from collections import defaultdict
from dataclasses import dataclass
from typing import List, Tuple


@dataclass
class request:
    ip:str
    payload:int
    timestamp:float
    endpoint:str


class extractor:
    def __init__(self, window_seconds: int = 10, top_k: int = 10):
        self.seconds=window_seconds
        self.top_k=top_k
        self.events:list[request]=[]
        self.ip_counts:defaultdict=defaultdict(int)
    def add_event(self,ip:str,payload:int,endpoint:str):
        event=request(
            ip=ip,
            timestamp=time.time(),
            payload=payload,
            endpoint=endpoint
        )
        self.events.append(event)
        self.ip_counts[ip] += 1
        self.prune()
    
    def prune(self):
        cutoff=time.time()-self.seconds
        past_events=[ e for e in self.events if e.timestamp<cutoff]
        for e in past_events:
            self.ip_counts[e.ip]-=1
            if self.ip_counts[e.ip]==0:
                del self.ip_counts[e.ip]
        self.events = [e for e in self.events if e.timestamp >= cutoff]
    

    def features(self)->dict:
        if not self.events:
            return {}
        now=time.time()
        window_duration=min(self.seconds,now - self.events[0].timestamp)

        requests=len(self.events)/max(window_duration,1)

        unique_ip = len(self.ip_counts)

        heap=[]
        for ip,count in self.ip_counts.items():
            if len(heap)<self.top_k:
                heapq.heappush(heap,(count,ip))
            elif count > heap[0][0]:
                heapq.heapreplace(heap,(count,ip))
        
        top_k=sum(c for c ,_ in heap)/max(len(heap),1)

        sizes=[e.payload for e in self.events]
        avg_load=sum(sizes)/len(sizes)

        endpoint_count=defaultdict(int)
        for e in self.events:
            endpoint_count[e.endpoint]+=1
        total=len(self.events)
        entropy=0.0
        for count in endpoint_count.values():
            p=count/total
            if p > 0:
                entropy -= p * math.log2(p)

        return {
            "requests_per_sec": round(requests, 3),
            "unique_ips":        unique_ip,
            "top_k_avg":         round(top_k, 3),
            "avg_payload":       round(avg_load, 3),
            "endpoint_entropy":  round(entropy, 3),
            "event_count":       len(self.events)
        }







    

