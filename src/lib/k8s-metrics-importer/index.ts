import {ConfigParams} from './types';
import {PluginInterface, PluginParams} from '../types/interface';

const https = require('https');
const axios = require('axios');

export const K8sMetricsImporter = (
  globalConfig: ConfigParams
): PluginInterface => {
  const metadata = {
    kind: 'execute',
  };

  /**
   * Execute's strategy description here.
   * validate vars
   * get cluster metrics
   * get cluster node details
   * match pods & nodes calculate percentage usage
   * output result
   */
  const execute = async (
    inputs: PluginParams[],
    config?: ConfigParams
  ): Promise<PluginParams[]> => {
    const mergedConfig = Object.assign({}, globalConfig, config);

    let token = '';
    if (mergedConfig['token']) {
      token = mergedConfig['token'];
    } else if (process.env.K8S_TOKEN) {
      token = process.env.K8S_TOKEN;
    } else {
      console.log('No token set. we wont generate or add anything...');
    }

    if (token === '') {
      return inputs;
    }

    let k8sHostURL = '';
    if (mergedConfig['k8s-host-url']) {
      k8sHostURL = mergedConfig['k8s-host-url'];
    } else if (process.env.K8S_HOST_URL) {
      k8sHostURL = process.env.K8S_HOST_URL;
    } else {
      k8sHostURL = 'https://localhost:6443';
    }

    function getNodeTotalCPU(nodes: any[], nodeName: any) {
      let output = 1;
      nodes.forEach(node => {
        if (node['metadata']['name'] === nodeName) {
          output = parseInt(node['status']['capacity']['cpu']);
        }
      });
      return output;
    }

    function getNodeTotalMemory(nodes: any[], nodeName: any) {
      let output = 1000000;
      nodes.forEach(node => {
        if (node['metadata']['name'] === nodeName) {
          output = parseInt(
            node['status']['capacity']['memory'].match(/(\d+)/)[0]
          );
        }
      });
      return output;
    }

    function getPodNodeName(pods: any[], podName: any) {
      let output = 'default';
      pods.forEach(pod => {
        if (pod['metadata']['name'] === podName) {
          // console.log('gotenm', pod['metadata']['name']);
          output = pod['spec']['nodeName'];
        }
      });
      return output;
    }

    const containers: PluginParams[] = [];

    const client = axios.create({
      timeout: 60000,
      httpsAgent: new https.Agent({keepAlive: true}),
    });

    // console.log('getting nodes');
    const nodeRes = await client.get(k8sHostURL + '/api/v1/nodes', {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // get metadata
    // console.log(res.status);
    if (nodeRes.status === 200) {
      console.log('Got node meta');
      // console.log('insiode', JSON.stringify(nodeRes.data));
      // return res.data;
    } else {
      throw new Error('Could not retrieve metrics' + nodeRes.data);
    }

    // console.log('getting pods');
    const podRes = await client.get(k8sHostURL + '/api/v1/pods', {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // get metadata
    // console.log(res.status);
    if (podRes.status === 200) {
      console.log('Got pod meta');
      // console.log('pods - ', JSON.stringify(podRes.data));
      // return res.data;
    } else {
      throw new Error('Could not retrieve metrics' + podRes.data);
    }

    const metricsRes = await client.get(
      k8sHostURL + '/apis/metrics.k8s.io/v1beta1/pods',
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // get metadata
    // console.log(res.status);
    if (metricsRes.status === 200) {
      console.log('Got k8s stats');
      //   console.log("insiode", JSON.stringify(res.data));
    } else {
      throw new Error('Could not retrieve metrics' + metricsRes.data);
    }

    // - `memory/utilization`: percentage of the total available memory being used in the input period
    // - `memory/capacity`: the total amount of memory available, in GB

    // - `network/data-in`: inbound data in GB
    // - `network/data-out`: outbound data in GB

    metricsRes.data.items.forEach(
      (pod: {
        containers: {name: any; usage: {cpu: any; memory: any}}[];
        metadata: {name: any; namespace: any; labels: {[x: string]: any}};
        timestamp: any;
        window: any;
      }) => {
        // console.log(pod.metadata.name);
        // console.log(podRes.data.items[0]);
        const nodeName = getPodNodeName(podRes.data.items, pod.metadata.name);
        pod.containers.forEach(
          (container: {name: any; usage: {cpu: any; memory: any}}) => {
            containers.push(
              Object.assign(
                {
                  'k8s/node/name': nodeName,
                  'k8s/pod/name': pod.metadata.name,
                  'k8s/container/name': container.name,
                  'k8s/namespace': pod.metadata.namespace,
                  'k8s/label/k8s-app': pod.metadata.labels['k8s-app'],
                  timestamp: pod.timestamp,
                  duration: parseFloat(pod.window.match(/(\d+)/)[0]),
                  'k8s/cpu/utilization': container.usage.cpu.match(/(\d+)/)[0],
                  'cpu/utilization':
                    container.usage.cpu.match(/(\d+)/)[0] /
                    (getNodeTotalCPU(nodeRes.data.items, nodeName) *
                      1000000000),
                  'k8s/memory/utilization':
                    container.usage.memory.match(/(\d+)/)[0],
                  'memory/utilization':
                    container.usage.memory.match(/(\d+)/)[0] /
                    getNodeTotalMemory(nodeRes.data.items, nodeName),
                  'memory/capacity': getNodeTotalMemory(
                    nodeRes.data.items,
                    nodeName
                  ),
                },
                ...inputs
              )
            );
          }
        );
      }
    );

    return containers;
  };

  return {
    metadata,
    execute,
  };
};
