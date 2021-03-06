import * as React from "react";
import * as ReactDOM from "react-dom";
import { withResizeDetector } from "react-resize-detector";

import { IntrospectionQuery } from "graphql-birdseye-core/src/graphql/utilities/introspectionQuery";
import { GraphQLSchema } from "graphql-birdseye-core/src/graphql/type";

import {
  defaultTheme,
  Theme,
  JointJS,
  SchemaDataStructure as SchemaBirdseye,
  IntrospectionDataStructure as IntrospectionBirdseye,
} from "graphql-birdseye-core";
import { Birdseye } from "graphql-birdseye-core/dist/dataStructure";
import Loader from "./Loader";

export interface GraphqlBirdseyeProps {
  dataStructure: Birdseye | null;
  theme?: Theme;
  style?: any;
}

interface ResizeDetectorProps {
  width: number;
  height: number;
}

export interface State {
  activeType: string;
  loading: boolean;
}
class GraphqlBirdseye extends React.Component<
  GraphqlBirdseyeProps & ResizeDetectorProps
  > {
  ref: any;
  jointjs: JointJS;
  state: State = {
    activeType: "Query",
    loading: false,
  };
  constructor(props: GraphqlBirdseyeProps & ResizeDetectorProps) {
    super(props);
    this.jointjs = new JointJS({ theme: props.theme });
  }

  async componentDidMount() {
    if (!this.props.dataStructure) {
      return;
    }
    const bounds = this.getBounds();
    this.jointjs.on("loading:start", this.startLoading);
    this.jointjs.on("loading:stop", this.stopLoading);
    await this.jointjs.init(
      ReactDOM.findDOMNode(this.ref),
      bounds,
      this.props.dataStructure
    );
  }

  componentWillUnmount() {
    this.jointjs.destroy();
  }
  async componentWillReceiveProps(nextProps: GraphqlBirdseyeProps & ResizeDetectorProps) {
    if (this.props.width !== nextProps.width || this.props.height !== nextProps.height) {
      this.jointjs.setSize(nextProps.width, nextProps.height)
    }
    if (nextProps.dataStructure && this.props.dataStructure !== nextProps.dataStructure) {
      await this.jointjs.setDataStructure(nextProps.dataStructure)
    }
  }

  private stopLoading = () =>
    new Promise((resolve) =>
      this.setState(
        {
          loading: false,
        },
        resolve
      )
    );

  private startLoading = () =>
    new Promise((resolve) => {
      this.setState(
        {
          loading: true,
        },
        resolve
      );
    });

  private getBounds() {
    return this.ref.getBoundingClientRect();
  }

  render() {
    const { theme = defaultTheme } = this.props;
    return (
      <div
        style={{
          ...(this.props.style || {}),
          display: "flex",
        }}
      >
        <div id="playground" ref={this.setRef} style={{ flex: 1 }} />
        {this.state.loading && <Loader colors={theme.colors} />}
      </div>
    );
  }
  setRef = (ref: any) => {
    this.ref = ref;
  };
}

export interface SchemaProviderProps {
  introspectionQuery?: IntrospectionQuery;
  schema?: GraphQLSchema;
}
const schemaProvider = (
  Component: React.ComponentType<GraphqlBirdseyeProps>
) => {
  return class SchemaProvider extends React.PureComponent<
    GraphqlBirdseyeProps & SchemaProviderProps
    > {
    // displayName: `schemaProvider(${Component.displayName})`
    render() {
      const { introspectionQuery, schema, ...props } = this
        .props as SchemaProviderProps;
      let dataStructure: any = null;
      if (schema) {
        dataStructure = new SchemaBirdseye(schema);
      } else if (introspectionQuery) {
        dataStructure = new IntrospectionBirdseye(introspectionQuery.__schema);
      }
      return <Component dataStructure={dataStructure} {...props} />;
    }
  };
};

export default schemaProvider(withResizeDetector(GraphqlBirdseye));
