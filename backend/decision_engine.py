def decide(predict:dict,features:dict, top: list) -> dict:
    if predict["label"]!="attack" or predict["confidence"]<0.85:
        return {
            "is_attack": False,
            "ban_ips": [],
            "rate_limit":None,
            "confidence":predict["confidence"]
        }
    ban_ips = [ip for count, ip in top if count > 500]
    threshold=[50, 100, 150, 200, 250, 300]

    avg_user_rate = features["requests_per_sec"] / max(features["unique_ips"], 1)
    dp = [None] * len(threshold)

    for i, t in enumerate(threshold):
        legitimate_safe = avg_user_rate < t
        attackers_blocked = features["top_k_avg"] > t  

        
        if legitimate_safe and attackers_blocked:
            dp[i] = t   
        else:
            dp[i] = None
    

    valid = [t for t in dp if t is not None]
    rate_limit = min(valid) if valid else 300

    return {
        "is_attack":  True,
        "ban_ips":    ban_ips,
        "rate_limit": rate_limit,
        "confidence": predict["confidence"]
    }


class DDoSDetector:
    name = "ddos"

    def analyze(self, features: dict) -> float:
        score = 0.0
        if features["requests_per_sec"] > 1000:
            score += 0.4
        if features["unique_ips"] > 1000:
            score += 0.3
        if features["endpoint_entropy"] < 0.2:
            score += 0.3
        return score


class SlowlorisDetector:
    name = "slowloris"

    def analyze(self, features: dict) -> float:
        score = 0.0
        if features["requests_per_sec"] < 50:
            score += 0.3
        if features["unique_ips"] < 20:
            score += 0.4
        if features["avg_payload"] > 5000:
            score += 0.3
        return score


class BruteForceDetector:
    name = "bruteforce"

    def analyze(self, features: dict) -> float:
        score = 0.0
        if features["unique_ips"] < 10:
            score += 0.5
        if features["requests_per_sec"] > 50:
            score += 0.3
        if features["endpoint_entropy"] < 0.1:
            score += 0.2
        return score


class RansomwareDetector:
    name = "ransomware"

    def analyze(self, _features: dict) -> float:
        score = 0.0
        # TODO: add ransomware signatures
        return score


class DetectorFactory:
    _detectors = {
        "ddos":       DDoSDetector,
        "slowloris":  SlowlorisDetector,
        "bruteforce": BruteForceDetector,
        "ransomware": RansomwareDetector,
    }

    @classmethod
    def create(cls, attack_type: str):
        detector_class = cls._detectors.get(attack_type)
        if not detector_class:
            raise ValueError(f"unknown attack type: {attack_type}")
        return detector_class()

    @classmethod
    def available(cls) -> list:
        return list(cls._detectors.keys())

