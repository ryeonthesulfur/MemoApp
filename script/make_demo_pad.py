# ビジュアライザー(public/visualizer/index.html)の「デモ音」を、WAVファイルに書き出すスクリプト
# ブラウザ(Web Audio API)で鳴らしているのと同じ計算を、Pythonで再現している
#
# 使い方: python3 make_demo_pad.py   → 同じフォルダに demo_pad.wav ができる

import math
import os
import struct
import wave

RATE = 44100      # 1秒あたりのサンプル数
SECONDS = 90      # 長さ
FADE_IN = 3       # 最初の3秒でフェードイン(ブラウザ版と同じ)
FADE_OUT = 6      # 最後の6秒でフェードアウト

# 和音: 周波数, 波の形, 音程のずらし(セント), 音量が波打つ速さ(Hz)
VOICES = [
    (110.0, 'triangle', -4, 0.05),
    (164.8, 'sine',      3, 0.08),
    (220.0, 'triangle', -2, 0.11),
    (277.2, 'sine',      5, 0.14),
    (329.6, 'triangle', -3, 0.17),
]


def wave_value(kind, phase):
    if kind == 'sine':
        return math.sin(2 * math.pi * phase)
    p = phase % 1.0  # 三角波
    return 4 * p - 1 if p < 0.5 else 3 - 4 * p


# ローパスフィルタ(900Hz)。Web Audio の BiquadFilter(lowpass, Q=1)と同じ式
def lowpass_coeffs(freq, q):
    w0 = 2 * math.pi * freq / RATE
    alpha = math.sin(w0) / (2 * q)
    cos = math.cos(w0)
    b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2
    a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha
    return b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0


def main():
    total = RATE * SECONDS
    b0, b1, b2, a1, a2 = lowpass_coeffs(900, 1.0)
    x1 = x2 = y1 = y2 = 0.0
    freqs = [f * 2 ** (d / 1200) for f, _, d, _ in VOICES]
    frames = bytearray()

    for n in range(total):
        t = n / RATE
        s = 0.0
        for (f, kind, _, lfo), fr in zip(VOICES, freqs):
            gain = 0.2 + 0.18 * math.sin(2 * math.pi * lfo * t)
            s += wave_value(kind, fr * t) * gain

        # 全体の音量: フェードイン → 0.18 → フェードアウト
        out = 0.18
        if t < FADE_IN:
            out *= t / FADE_IN
        if t > SECONDS - FADE_OUT:
            out *= (SECONDS - t) / FADE_OUT
        x = s * out

        y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, x, y1, y

        frames += struct.pack('<h', int(max(-1.0, min(1.0, y)) * 32767))

    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'demo_pad.wav')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(bytes(frames))
    print('書き出しました:', path)


if __name__ == '__main__':
    main()
