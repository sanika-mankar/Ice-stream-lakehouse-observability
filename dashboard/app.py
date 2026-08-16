import streamlit as st

st.set_page_config(page_title="Ice Stream", layout="wide")

st.title("Ice Stream: Real-Time Lakehouse Observability")

st.write(
    "A real-time data observability dashboard for monitoring streaming e-commerce transactions and detecting data quality issues."
)

st.markdown("---")

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Total Transactions", "0")

with col2:
    st.metric("Valid Transactions", "0")

with col3:
    st.metric("Invalid Transactions", "0")

with col4:
    st.metric("Pipeline Status", "Running")

st.markdown("---")

st.subheader("Pipeline Overview")
st.info("Dashboard integration will be connected in Day 2.")

st.subheader("Recent Alerts")
st.warning("No alerts detected yet.")

st.subheader("Validation Summary")
st.write("Validation statistics will be displayed here after integration.")
