# Quick Start Guide: MSP Helpdesk AI Intelligence Platform Datasets

## 📦 What You Have

7 production-ready CSV datasets totaling **8,901 rows** and **1.9 MB**:
1. Support Tickets (2,000 rows)
2. E-Commerce Orders & Products (1,500 rows)
3. SLA & Operations Analytics (1,200 rows)
4. Customer Feedback & Sentiment (1,200 rows)
5. Knowledge Base / FAQ (501 rows)
6. AI Agent Workflows (1,500 rows)
7. Product Image Analysis (1,000 rows)

---

## ⚡ Quick Integration (5 Minutes)

### Step 1: Upload to AWS S3
```bash
# Create S3 bucket
aws s3 mb s3://msp-helpdesk-datasets-prod

# Upload all CSV files
aws s3 cp support_tickets_enterprise.csv s3://msp-helpdesk-datasets-prod/
aws s3 cp enterprise_orders_products.csv s3://msp-helpdesk-datasets-prod/
aws s3 cp sla_operations_analytics.csv s3://msp-helpdesk-datasets-prod/
aws s3 cp customer_feedback_sentiment.csv s3://msp-helpdesk-datasets-prod/
aws s3 cp enterprise_knowledge_base.csv s3://msp-helpdesk-datasets-prod/
aws s3 cp ai_agent_workflows.csv s3://msp-helpdesk-datasets-prod/
aws s3 cp product_image_analysis.csv s3://msp-helpdesk-datasets-prod/

# Or bulk upload
aws s3 sync . s3://msp-helpdesk-datasets-prod/ --include "*.csv"
```

### Step 2: Create Athena Tables
```sql
-- Create database
CREATE DATABASE IF NOT EXISTS msp_helpdesk_prod;
USE msp_helpdesk_prod;

-- Table 1: Support Tickets
CREATE EXTERNAL TABLE IF NOT EXISTS support_tickets (
    ticket_id STRING,
    customer_id STRING,
    client_company STRING,
    customer_name STRING,
    email STRING,
    phone STRING,
    issue_category STRING,
    issue_subcategory STRING,
    ticket_description STRING,
    priority STRING,
    status STRING,
    assigned_team STRING,
    assigned_agent STRING,
    created_at STRING,
    updated_at STRING,
    resolution_time_hours INT,
    sla_target_hours INT,
    sla_status STRING,
    sentiment STRING,
    customer_region STRING,
    communication_channel STRING,
    escalation_level INT,
    repeated_issue STRING,
    ai_confidence_score DOUBLE,
    recommended_action STRING,
    auto_resolved STRING,
    root_cause STRING,
    business_impact STRING,
    ticket_source STRING
)
STORED AS CSV
LOCATION 's3://msp-helpdesk-datasets-prod/support_tickets/'
TBLPROPERTIES ("skip.header.line.count"="1");

-- Table 2: Orders & Products
CREATE EXTERNAL TABLE IF NOT EXISTS enterprise_orders (
    order_id STRING,
    customer_id STRING,
    product_id STRING,
    product_name STRING,
    product_category STRING,
    brand STRING,
    ordered_color STRING,
    received_color STRING,
    damage_detected STRING,
    missing_item STRING,
    replacement_requested STRING,
    refund_requested STRING,
    payment_status STRING,
    order_status STRING,
    delivery_status STRING,
    invoice_number STRING,
    order_amount DOUBLE,
    refund_amount DOUBLE,
    shipping_region STRING,
    seller_name STRING,
    warehouse_location STRING,
    return_reason STRING,
    delivery_partner STRING,
    purchase_date STRING,
    delivery_date STRING,
    customer_satisfaction INT
)
STORED AS CSV
LOCATION 's3://msp-helpdesk-datasets-prod/orders/'
TBLPROPERTIES ("skip.header.line.count"="1");

-- Table 3: SLA Operations
CREATE EXTERNAL TABLE IF NOT EXISTS sla_operations (
    sla_event_id STRING,
    ticket_id STRING,
    assigned_team STRING,
    severity STRING,
    sla_target_hours INT,
    first_response_time INT,
    resolution_time INT,
    breach_risk_score DOUBLE,
    breached STRING,
    escalation_triggered STRING,
    workload_score DOUBLE,
    agent_utilization DOUBLE,
    queue_size INT,
    region STRING,
    business_unit STRING,
    manager_name STRING,
    support_shift STRING,
    incident_type STRING,
    operational_risk STRING,
    created_date STRING
)
STORED AS CSV
LOCATION 's3://msp-helpdesk-datasets-prod/sla/'
TBLPROPERTIES ("skip.header.line.count"="1");

-- Table 4: Customer Feedback
CREATE EXTERNAL TABLE IF NOT EXISTS customer_feedback (
    feedback_id STRING,
    ticket_id STRING,
    customer_id STRING,
    feedback_text STRING,
    feedback_rating INT,
    sentiment STRING,
    churn_risk STRING,
    response_time_satisfaction INT,
    agent_behavior_score INT,
    resolution_satisfaction INT,
    would_recommend STRING,
    customer_emotion STRING,
    repeat_customer STRING,
    feedback_channel STRING,
    feedback_date STRING
)
STORED AS CSV
LOCATION 's3://msp-helpdesk-datasets-prod/feedback/'
TBLPROPERTIES ("skip.header.line.count"="1");

-- Table 5: Knowledge Base
CREATE EXTERNAL TABLE IF NOT EXISTS knowledge_base (
    kb_article_id STRING,
    issue_category STRING,
    issue_subcategory STRING,
    question STRING,
    answer STRING,
    resolution_steps STRING,
    automation_possible STRING,
    estimated_resolution_time STRING,
    required_team STRING,
    risk_level STRING,
    policy_reference STRING,
    escalation_required STRING
)
STORED AS CSV
LOCATION 's3://msp-helpdesk-datasets-prod/kb/'
TBLPROPERTIES ("skip.header.line.count"="1");

-- Table 6: AI Workflows
CREATE EXTERNAL TABLE IF NOT EXISTS ai_workflows (
    workflow_id STRING,
    ticket_id STRING,
    agent_name STRING,
    agent_stage STRING,
    input_summary STRING,
    output_summary STRING,
    confidence_score DOUBLE,
    recommended_action STRING,
    auto_resolution_status STRING,
    escalation_required STRING,
    human_override STRING,
    decision_timestamp STRING,
    processing_time_seconds INT,
    workflow_status STRING
)
STORED AS CSV
LOCATION 's3://msp-helpdesk-datasets-prod/workflows/'
TBLPROPERTIES ("skip.header.line.count"="1");

-- Table 7: Image Analysis
CREATE EXTERNAL TABLE IF NOT EXISTS product_image_analysis (
    analysis_id STRING,
    ticket_id STRING,
    product_id STRING,
    uploaded_image_name STRING,
    damage_detected STRING,
    damage_type STRING,
    color_mismatch STRING,
    missing_component STRING,
    ocr_detected_text STRING,
    image_confidence_score DOUBLE,
    recommended_decision STRING,
    fraud_risk_score DOUBLE,
    manual_review_required STRING,
    analysis_timestamp STRING
)
STORED AS CSV
LOCATION 's3://msp-helpdesk-datasets-prod/images/'
TBLPROPERTIES ("skip.header.line.count"="1");
```

### Step 3: Verify Data Load
```sql
-- Check row counts
SELECT 'support_tickets' as table_name, COUNT(*) as rows FROM support_tickets
UNION ALL
SELECT 'enterprise_orders', COUNT(*) FROM enterprise_orders
UNION ALL
SELECT 'sla_operations', COUNT(*) FROM sla_operations
UNION ALL
SELECT 'customer_feedback', COUNT(*) FROM customer_feedback
UNION ALL
SELECT 'knowledge_base', COUNT(*) FROM knowledge_base
UNION ALL
SELECT 'ai_workflows', COUNT(*) FROM ai_workflows
UNION ALL
SELECT 'product_image_analysis', COUNT(*) FROM product_image_analysis;
```

---

## 📊 Essential Queries (Copy & Paste Ready)

### Query 1: SLA Breach Analysis
```sql
-- Tickets breaching SLA by category and region
SELECT 
    issue_category,
    customer_region,
    COUNT(*) as total_tickets,
    SUM(CASE WHEN sla_status = 'Breached' THEN 1 ELSE 0 END) as breached_tickets,
    ROUND(100.0 * SUM(CASE WHEN sla_status = 'Breached' THEN 1 ELSE 0 END) / COUNT(*), 2) as breach_pct,
    ROUND(AVG(resolution_time_hours), 2) as avg_resolution_hours,
    ROUND(AVG(sla_target_hours), 1) as avg_sla_target
FROM support_tickets
WHERE status IN ('Resolved', 'Closed')
GROUP BY issue_category, customer_region
ORDER BY breach_pct DESC, total_tickets DESC;
```

### Query 2: Auto-Resolution Potential
```sql
-- KB articles that can be auto-resolved, ranked by ticket impact
SELECT 
    k.kb_article_id,
    k.issue_category,
    k.issue_subcategory,
    k.automation_possible,
    COUNT(DISTINCT t.ticket_id) as related_tickets,
    ROUND(AVG(CASE WHEN k.automation_possible = 'Yes' THEN 0 WHEN k.automation_possible = 'Partial' THEN 30 ELSE 120 END), 0) as avg_time_saved_min,
    COUNT(DISTINCT CASE WHEN k.automation_possible = 'Yes' THEN t.ticket_id END) as can_automate,
    ROUND(AVG(CAST(t.resolution_time_hours AS DOUBLE)), 1) as avg_resolution_hours
FROM knowledge_base k
LEFT JOIN support_tickets t ON k.issue_category = t.issue_category 
    AND k.issue_subcategory = t.issue_subcategory
WHERE k.automation_possible IN ('Yes', 'Partial')
GROUP BY k.kb_article_id, k.issue_category, k.issue_subcategory, k.automation_possible
ORDER BY related_tickets DESC, can_automate DESC
LIMIT 25;
```

### Query 3: Refund & Fraud Analysis
```sql
-- Analyze refund patterns and fraud risk
SELECT 
    o.product_category,
    o.warehouse_location,
    COUNT(*) as total_orders,
    SUM(CASE WHEN o.damage_detected = 'Yes' THEN 1 ELSE 0 END) as damaged_items,
    SUM(CASE WHEN o.refund_requested = 'Yes' THEN 1 ELSE 0 END) as refund_requests,
    ROUND(100.0 * SUM(CASE WHEN o.refund_requested = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) as refund_rate,
    ROUND(SUM(CASE WHEN o.refund_requested = 'Yes' THEN o.refund_amount ELSE 0 END), 2) as total_refunds,
    ROUND(AVG(CASE WHEN i.damage_detected = 'Yes' THEN i.fraud_risk_score ELSE 0 END), 3) as avg_fraud_risk,
    COUNT(DISTINCT CASE WHEN i.manual_review_required = 'Yes' THEN i.analysis_id END) as manual_reviews_needed
FROM enterprise_orders o
LEFT JOIN product_image_analysis i ON o.order_id = SUBSTRING(i.ticket_id, 5, 6)
GROUP BY o.product_category, o.warehouse_location
ORDER BY refund_rate DESC, total_refunds DESC;
```

### Query 4: Customer Churn Prediction
```sql
-- Identify high-risk churn customers
SELECT 
    c.customer_id,
    c.customer_name,
    c.email,
    COUNT(DISTINCT t.ticket_id) as total_tickets,
    MAX(t.created_at) as last_ticket_date,
    SUM(CASE WHEN cf.churn_risk = 'High' THEN 1 ELSE 0 END) as high_churn_incidents,
    SUM(CASE WHEN cf.sentiment IN ('Very Negative', 'Negative') THEN 1 ELSE 0 END) as negative_feedbacks,
    SUM(CASE WHEN t.sla_status = 'Breached' THEN 1 ELSE 0 END) as breached_slas,
    ROUND(AVG(cf.feedback_rating), 2) as avg_rating,
    COUNT(DISTINCT CASE WHEN cf.would_recommend = 'No' THEN cf.feedback_id END) as not_recommend_count
FROM support_tickets t
JOIN customer_feedback c ON t.customer_id = c.customer_id
LEFT JOIN customer_feedback cf ON t.ticket_id = cf.ticket_id
WHERE c.repeat_customer = 'Yes'
GROUP BY c.customer_id, c.customer_name, c.email
HAVING SUM(CASE WHEN cf.churn_risk = 'High' THEN 1 ELSE 0 END) >= 2
ORDER BY high_churn_incidents DESC, negative_feedbacks DESC;
```

### Query 5: AI Agent Performance
```sql
-- Track AI agent decision quality and impact
SELECT 
    w.agent_name,
    w.agent_stage,
    COUNT(*) as decisions_made,
    ROUND(AVG(w.confidence_score), 3) as avg_confidence,
    SUM(CASE WHEN w.confidence_score >= 0.85 THEN 1 ELSE 0 END) as high_confidence_decisions,
    SUM(CASE WHEN w.human_override = 'Yes' THEN 1 ELSE 0 END) as overridden_decisions,
    ROUND(100.0 * SUM(CASE WHEN w.human_override = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) as override_rate,
    SUM(CASE WHEN w.auto_resolution_status = 'Yes' THEN 1 ELSE 0 END) as successful_auto_resolutions,
    ROUND(AVG(w.processing_time_seconds), 0) as avg_processing_seconds,
    SUM(CASE WHEN w.workflow_status = 'Completed' THEN 1 ELSE 0 END) as completed_workflows,
    SUM(CASE WHEN w.escalation_required = 'Yes' THEN 1 ELSE 0 END) as escalations_triggered
FROM ai_workflows w
GROUP BY w.agent_name, w.agent_stage
ORDER BY override_rate ASC, avg_confidence DESC;
```

### Query 6: Team Capacity Planning
```sql
-- Real-time team workload and capacity analysis
SELECT 
    s.assigned_team,
    s.region,
    s.support_shift,
    COUNT(*) as incident_count,
    ROUND(AVG(s.workload_score), 1) as avg_workload_score,
    ROUND(AVG(s.agent_utilization), 1) as avg_agent_utilization,
    ROUND(AVG(s.queue_size), 1) as avg_queue_size,
    SUM(CASE WHEN s.breached = 'Yes' THEN 1 ELSE 0 END) as breached_incidents,
    SUM(CASE WHEN s.escalation_triggered = 'Yes' THEN 1 ELSE 0 END) as escalations,
    COUNT(DISTINCT s.manager_name) as managers_involved,
    CASE 
        WHEN ROUND(AVG(s.workload_score), 1) > 80 THEN 'CRITICAL - Hiring needed'
        WHEN ROUND(AVG(s.workload_score), 1) > 70 THEN 'HIGH - Monitor closely'
        WHEN ROUND(AVG(s.workload_score), 1) > 50 THEN 'MODERATE - Balanced'
        ELSE 'LOW - Adequate capacity'
    END as capacity_status
FROM sla_operations s
GROUP BY s.assigned_team, s.region, s.support_shift
ORDER BY avg_workload_score DESC, avg_queue_size DESC;
```

### Query 7: Resolution Time by Priority & Category
```sql
-- Benchmark resolution times for SLA optimization
SELECT 
    t.priority,
    t.issue_category,
    COUNT(*) as ticket_count,
    ROUND(AVG(t.resolution_time_hours), 1) as avg_resolution_hours,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY t.resolution_time_hours), 1) as median_hours,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY t.resolution_time_hours), 1) as p95_hours,
    ROUND(AVG(t.sla_target_hours), 1) as avg_sla_target,
    ROUND(100.0 * SUM(CASE WHEN t.sla_status = 'Met' THEN 1 ELSE 0 END) / COUNT(*), 1) as sla_met_pct,
    SUM(CASE WHEN t.auto_resolved = 'Yes' THEN 1 ELSE 0 END) as auto_resolved_count
FROM support_tickets t
WHERE t.status IN ('Resolved', 'Closed')
GROUP BY t.priority, t.issue_category
ORDER BY t.priority DESC, avg_resolution_hours DESC;
```

---

## 🤖 AWS Bedrock Integration Example

```python
import json
import boto3
import pandas as pd

# Initialize clients
athena = boto3.client('athena')
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
s3 = boto3.client('s3')

def analyze_tickets_with_bedrock(query_result_location):
    """
    Use Bedrock Claude to analyze tickets and provide insights
    """
    
    # Read tickets from Athena results
    tickets_df = pd.read_csv(query_result_location)
    
    # Group by category for analysis
    for category in tickets_df['issue_category'].unique():
        category_tickets = tickets_df[tickets_df['issue_category'] == category]
        
        # Prepare analysis prompt
        analysis_prompt = f"""
        Analyze these {len(category_tickets)} support tickets in the {category} category:
        
        Sample tickets:
        {category_tickets.head(5).to_string()}
        
        Metrics:
        - Average resolution time: {category_tickets['resolution_time_hours'].mean():.1f} hours
        - SLA breach rate: {(category_tickets['sla_status'] == 'Breached').sum() / len(category_tickets) * 100:.1f}%
        - Auto-resolution rate: {(category_tickets['auto_resolved'] == 'Yes').sum() / len(category_tickets) * 100:.1f}%
        - Average sentiment: {category_tickets['sentiment'].value_counts().index[0]}
        
        Provide:
        1. Key insight about this ticket category
        2. Root cause pattern (if any)
        3. Recommended improvement action
        4. Expected impact if improvement implemented
        """
        
        # Call Bedrock
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            body=json.dumps({
                'messages': [{
                    'role': 'user',
                    'content': analysis_prompt
                }],
                'max_tokens': 600,
                'temperature': 0.7
            })
        )
        
        # Parse response
        result = json.loads(response['body'].read())
        analysis = result['content'][0]['text']
        
        print(f"\n{'='*70}")
        print(f"ANALYSIS: {category}")
        print(f"{'='*70}")
        print(analysis)

# Example usage
analyze_tickets_with_bedrock('s3://bucket/athena_results/')
```

---

## 📈 QuickSight Dashboard Setup

### Dashboard 1: Executive Overview
```
Widgets:
1. Total tickets (KPI) - Card
2. SLA compliance rate (KPI) - Gauge
3. Average CSAT (KPI) - Number
4. Tickets by priority (Pie chart)
5. SLA status trend (Line chart)
6. Top issues by volume (Bar chart)
7. Customer sentiment (Stacked bar)
8. Team workload heatmap (Heat map)
```

### Dashboard 2: Operations Manager
```
Widgets:
1. Real-time queue size (KPI)
2. Agent utilization % (Gauge)
3. Open tickets by team (Table)
4. First response time trend (Area chart)
5. Escalation rate by team (Bar chart)
6. Workload distribution (Pie chart)
7. Top repeating issues (Top N)
8. Agent performance (Ranked table)
```

### Dashboard 3: AI & Automation
```
Widgets:
1. AI confidence scores (Distribution)
2. Auto-resolution rate (KPI)
3. Human override rate (Gauge)
4. Workflow success rate (KPI)
5. AI accuracy by agent type (Bar chart)
6. Processing time trend (Line chart)
7. Escalation prediction accuracy (Table)
8. KB coverage analysis (Pie chart)
```

---

## ✅ Data Validation Checklist

```python
# validation_script.py
import pandas as pd

def validate_datasets():
    """Validate all datasets are loaded correctly"""
    
    files = {
        'support_tickets': 'support_tickets_enterprise.csv',
        'orders': 'enterprise_orders_products.csv',
        'sla_ops': 'sla_operations_analytics.csv',
        'feedback': 'customer_feedback_sentiment.csv',
        'kb': 'enterprise_knowledge_base.csv',
        'workflows': 'ai_agent_workflows.csv',
        'images': 'product_image_analysis.csv'
    }
    
    for name, file in files.items():
        df = pd.read_csv(file)
        
        print(f"\n✓ {name}: {len(df)} rows, {len(df.columns)} columns")
        print(f"  - Missing values: {df.isnull().sum().sum()}")
        print(f"  - Duplicates: {df.duplicated().sum()}")
        print(f"  - Memory: {df.memory_usage(deep=True).sum() / 1024:.1f} KB")

if __name__ == '__main__':
    validate_datasets()
```

---

## 🚀 Next Steps

1. **Upload to S3** (5 min)
2. **Create Athena tables** (10 min)
3. **Run validation queries** (5 min)
4. **Set up QuickSight** (15 min)
5. **Connect Bedrock** (10 min)
6. **Create dashboards** (30 min)
7. **Deploy AI workflows** (ongoing)

**Total setup time: ~75 minutes**

---

## 📞 Troubleshooting

### CSV not parsing?
- Ensure UTF-8 encoding
- Check for missing headers: `TBLPROPERTIES ("skip.header.line.count"="1")`
- Verify delimiter is comma

### Athena query fails?
- Check S3 path in LOCATION clause
- Verify IAM permissions for S3 access
- Ensure CSV column order matches table definition

### QuickSight connection issues?
- Grant Athena query results S3 bucket access
- Verify user has Athena privileges
- Check VPC/network settings for Bedrock

---

**Dataset Version:** 1.0 (Production Ready)  
**Last Updated:** 2026-05-28  
**Support:** See DATA_DICTIONARY_AND_GUIDE.md for complete documentation
