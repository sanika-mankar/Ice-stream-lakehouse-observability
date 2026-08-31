FROM flink:1.18.1-scala_2.12-java11

# Install Python 3.10 and Pip for PyFlink
RUN apt-get update -y && \
    apt-get install -y python3.10 python3.10-dev python3.10-distutils wget && \
    wget https://bootstrap.pypa.io/get-pip.py && \
    python3.10 get-pip.py && \
    rm get-pip.py && \
    ln -s /usr/bin/python3.10 /usr/bin/python && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Download Kafka connector to Flink's lib directory
RUN wget -P /opt/flink/lib/ https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-kafka/3.1.0-1.18/flink-sql-connector-kafka-3.1.0-1.18.jar

# Copy requirements and install
COPY flink/requirements.txt /opt/flink/requirements.txt
RUN pip install --no-cache-dir -r /opt/flink/requirements.txt

# Create app directory
WORKDIR /opt/flink/usrlib

# Copy shared domain/validation logic and Flink source
COPY app /opt/flink/usrlib/app
COPY flink/src /opt/flink/usrlib/flink/src

# Set PYTHONPATH so PyFlink can find our app module
ENV PYTHONPATH=/opt/flink/usrlib
