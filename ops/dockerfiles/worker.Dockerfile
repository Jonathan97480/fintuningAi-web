FROM python:3.11-slim
WORKDIR /app
ENV POETRY_VIRTUALENVS_CREATE=false
RUN pip install poetry==1.7.1
COPY pyproject.toml README.md ./
RUN poetry install --no-root
COPY src ./src
CMD [\"poetry\", \"run\", \"fintuning-worker\"]
