from dataclasses import dataclass
from datatime import datetime

@dataclass
class User:
    uid: str
    nome: str
    email: str
    created_at: datatime = field(default_factory=datatime.utcnow)