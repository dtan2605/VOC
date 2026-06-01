FROM python:3.11-slim

ARG BUILD_TYPE=dev
WORKDIR /app

# Choose minimal dev requirements by default to speed local builds
COPY requirements.txt requirements.dev.txt ./

# If building production, install full scientific stack; otherwise install dev deps
RUN if [ "$BUILD_TYPE" = "prod" ]; then \
			apt-get update && apt-get install -y --no-install-recommends build-essential gcc g++ libopenblas-dev liblapack-dev ca-certificates && rm -rf /var/lib/apt/lists/* && \
			pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt ; \
		else \
			pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.dev.txt ; \
		fi

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"]