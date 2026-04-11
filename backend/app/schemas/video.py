from pydantic import BaseModel


class VideoCredentialsRead(BaseModel):
    room_name: str
    room_url: str
    access_token: str
    sdk_url: str
