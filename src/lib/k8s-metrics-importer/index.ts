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
      throw new Error(
        'No auth token defined. Please set the auth token via the "token" config parameter or set the "K8S_TOKEN" environment variable'
      );
    }

    let k8sMetricsURL = '';
    if (mergedConfig['k8s-metrics-url']) {
      k8sMetricsURL = mergedConfig['k8s-metrics-url'];
    } else if (process.env.K8S_METRICS_URL) {
      k8sMetricsURL = process.env.K8S_METRICS_URL;
    } else {
      throw new Error(
        'No metrics url defined. Please set the auth token via the "k8s-metrics-url" config parameter or set the "K8S_METRICS_URL" environment variable'
      );
    }

    // console.log("token-",token)
    // console.log("k8s metrics url-",k8sMetricsURL)
    // console.log("pod-name",mergedConfig["pod-name"])
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    let client = axios.create({
      timeout: 60000,
      httpsAgent: new https.Agent({keepAlive: true}),
    });

    let res = await client.get(k8sMetricsURL, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // get metadata
    console.log(res.status);
    if (res.status == 200) {
      console.log('Got k8s stats');
      //   console.log("insiode", JSON.stringify(res.data));
      // return res.data;
    } else {
      throw new Error('Could not retrieve metrics' + res.data);
    }

    let containers: {
      'pod-name': any;
      'container-name': any;
      namespace: any;
      'label-k8s-app': any;
      timestamp: any;
      duration: any;
      'k8s-cpu-usage': any;
      'cpu-usage': any;
      'k8s-memory-usage': any;
    }[] = [];

    res.data.items.forEach(
      (pod: {
        containers: {name: any; usage: {cpu: any; memory: any}}[];
        metadata: {name: any; namespace: any; labels: {[x: string]: any}};
        timestamp: any;
        window: any;
      }) => {
        pod.containers.forEach(
          (container: {name: any; usage: {cpu: any; memory: any}}) => {
            containers.push({
              'pod-name': pod.metadata.name,
              'container-name': container.name,
              namespace: pod.metadata.namespace,
              'label-k8s-app': pod.metadata.labels['k8s-app'],
              timestamp: pod.timestamp,
              duration: pod.window,
              'k8s-cpu-usage': container.usage.cpu,
              'cpu-usage':
                container.usage.cpu.match(/(\d+)/)[0] / (mergedConfig['k8s-host-cores'] * 1000000000) ,
              'k8s-memory-usage': container.usage.memory,
            });
          }
        );
      }
    );

    return containers;

    return inputs.map(input => {
      // your logic here
      console.log('input ', input);

      globalConfig;

      return input;
    });
  };

  return {
    metadata,
    execute,
  };
};
