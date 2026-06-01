import numpy as np
import torch
import torch.nn as nn
from typing import List




SEQ_LEN=10
N_FEATURES=6
N_CLASSES=2
LABELS=["normal","attack"]##we have only two becasue  more categories eventually lead to saem outcome that is banned hence this is simpler model 

class cnn(nn.Module):
    def __init__(self):
        super().__init__()

        self.conv1 = nn.Conv1d(
            in_channels=N_FEATURES,
            out_channels=32,
            kernel_size=3,
            padding=1
        )
        self.conv2=nn.Conv1d(
            in_channels=32,
            out_channels=64,
            kernel_size=3,
            padding=1
        )

        self.relu=nn.ReLU()
        self.pool=nn.AdaptiveAvgPool1d(1)
        self.flatten =nn.Flatten()
        self.fnn=nn.Linear(64,N_CLASSES)
    

    def forward(self,x):
        """Conv1d scans the last dimension.
We want it to scan time, not features.
So time must be last → permute."""
        x=x.permute(0,2,1)
        x = self.relu(self.conv1(x))
        x = self.relu(self.conv2(x))
        x = self.pool(x)
        x = self.flatten(x)
        x = self.fnn(x)
        return x
def train():
    model=cnn( )
    criterion=nn.CrossEntropyLoss()
    optm=torch.optim.Adam(model.parameters()) 
    x=[]
    y=[]

    for _ in range(200):
        seq=[]
        for _ in range(SEQ_LEN):
            snapshot = [
                            np.random.uniform(10, 50),      
                            np.random.uniform(10, 100),     
                            np.random.uniform(2, 8),        
                            np.random.uniform(200, 1000),   
                            np.random.uniform(0.7, 1.0),    
                            np.random.uniform(100, 500),    
                        ]
            seq.append(snapshot)
        x.append(seq)
        y.append(0)
    
    for _ in range(200):
        seq=[]
        for _ in range(SEQ_LEN):
            snapshot=[
                            np.random.uniform(1000,9000),      
                            np.random.uniform(1000, 9000),     
                            np.random.uniform(500, 4000),        
                            512,   
                            np.random.uniform(0.0, 0.1),    
                            np.random.uniform(10000, 50000),    

            ]
            seq.append(snapshot) 
        x.append(seq)               
        y.append(1)

    x=torch.tensor(x,dtype=torch.float32)
    y=torch.tensor(y,dtype=torch.long)

    for e in range(100):
            optm.zero_grad() 
            output=model(x)
            losses=criterion(output,y)
            losses.backward()
            optm.step()
    return model



def predict(model,snap:list[dict])-> dict:
    snap=torch.tensor(snap,dtype=torch.float32)
    snap = snap.unsqueeze(0) 
    with torch.no_grad():
        output=model(snap)
        soft=torch.softmax(output,dim=1)
        class_idx = torch.argmax(soft, dim=1)
        label = LABELS[class_idx.item()]  
        confidence = soft[0][class_idx.item()].item()  # probability of chosen class
        return {
            "label":      label,
            "confidence": round(confidence, 3)
        }






                                

        




        

